const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper: calculate distance in km using Haversine formula
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @desc   Create a new donation
// @route  POST /api/donations
// @access Private (Donor)
const createDonation = async (req, res, next) => {
  try {
    const { foodName, foodType, quantity, servesCount, description, pickupTime, expiryTime, lat, lng } = req.body;

    const user = req.user;
    const address = user.address;

    const donation = await Donation.create({
      donorId: user._id,
      donorName: user.name,
      donorPhone: user.phone,
      foodName,
      foodType: foodType || 'veg',
      quantity: parseFloat(quantity),
      servesCount: servesCount ? parseInt(servesCount) : 0,
      description: description || '',
      pickupAddress: {
        full: address.full || '',
        district: address.district || '',
        landmark: address.landmark || '',
        pincode: address.pincode || '',
        lat: lat ? parseFloat(lat) : address.lat,
        lng: lng ? parseFloat(lng) : address.lng,
      },
      pickupTime: pickupTime || '',
      expiryTime: expiryTime || '',
      foodPhoto: req.file ? req.file.filename : null,
    });

    // Notify all approved NGOs
    const ngos = await User.find({ role: 'ngo', status: 'approved' });
    const notifPromises = ngos.map(ngo =>
      Notification.create({
        userId: ngo._id,
        title: 'New Food Donation Available',
        message: `${user.name} donated ${quantity}kg of ${foodName}. Check it out!`,
        type: 'success',
        category: 'donation',
        relatedDonationId: donation._id,
      })
    );
    await Promise.all(notifPromises);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('donation:new', { donation, fromUser: user.name });
    }

    res.status(201).json({ success: true, message: 'Donation created successfully!', donation });
  } catch (err) {
    next(err);
  }
};

// @desc   Get donations (role-filtered)
// @route  GET /api/donations
// @access Private
const getDonations = async (req, res, next) => {
  try {
    const user = req.user;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (user.role === 'donor') {
      query.donorId = user._id;
      if (status) query.status = status;
    } else if (user.role === 'ngo') {
      query.status = { $in: ['pending', 'accepted', 'picked_up', 'delivered'] };
      if (status) query.status = status;
    } else if (user.role === 'volunteer') {
      // Volunteers can only see <= 3kg donations that are accepted by NGO
      query.status = 'accepted';
      query.assignedVolunteer = null;
      query.quantity = { $lte: 3 };
    } else if (user.role === 'admin') {
      if (status) query.status = status;
    }

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('acceptedByNgo', 'name phone roleData.organizationName')
      .populate('assignedVolunteer', 'name phone');

    const total = await Donation.countDocuments(query);

    res.json({
      success: true,
      donations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Get a single donation
// @route  GET /api/donations/:id
// @access Private
const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name phone email address')
      .populate('acceptedByNgo', 'name phone roleData.organizationName')
      .populate('assignedVolunteer', 'name phone');

    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    res.json({ success: true, donation });
  } catch (err) {
    next(err);
  }
};

// @desc   Cancel a donation (donor)
// @route  PUT /api/donations/:id/cancel
// @access Private (Donor)
const cancelDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your donation' });
    }

    if (!['pending', 'accepted'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this donation' });
    }

    donation.status = 'cancelled';
    donation.cancelReason = req.body.reason || '';
    await donation.save();

    const io = req.app.get('io');
    if (io) io.emit('donation:cancelled', { donationId: donation._id });

    res.json({ success: true, message: 'Donation cancelled', donation });
  } catch (err) {
    next(err);
  }
};

// @desc   Accept a donation (NGO)
// @route  PUT /api/donations/:id/accept
// @access Private (NGO)
const acceptDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Donation is not available for acceptance' });
    }

    const ngo = req.user;
    donation.status = 'accepted';
    donation.acceptedByNgo = ngo._id;
    donation.ngoName = ngo.roleData?.organizationName || ngo.name;
    await donation.save();

    // Notify donor
    await Notification.create({
      userId: donation.donorId,
      title: 'Donation Accepted! 🎉',
      message: `Your donation of ${donation.foodName} has been accepted by ${donation.ngoName}.`,
      type: 'success',
      category: 'donation',
      relatedDonationId: donation._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(donation.donorId.toString()).emit('donation:accepted', {
        donationId: donation._id,
        ngoName: donation.ngoName,
      });
    }

    res.json({ success: true, message: 'Donation accepted!', donation });
  } catch (err) {
    next(err);
  }
};

// @desc   Reject a donation (NGO)
// @route  PUT /api/donations/:id/reject
// @access Private (NGO)
const rejectDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    donation.status = 'rejected';
    donation.rejectionReason = req.body.reason || '';
    await donation.save();

    await Notification.create({
      userId: donation.donorId,
      title: 'Donation Update',
      message: `Your donation of ${donation.foodName} was not accepted at this time.`,
      type: 'warning',
      category: 'donation',
      relatedDonationId: donation._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(donation.donorId.toString()).emit('donation:rejected', { donationId: donation._id });
    }

    res.json({ success: true, message: 'Donation rejected', donation });
  } catch (err) {
    next(err);
  }
};

// @desc   Assign volunteer (volunteer accepts delivery)
// @route  PUT /api/donations/:id/assign-volunteer
// @access Private (Volunteer)
const assignVolunteer = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Donation must be accepted by NGO first' });
    }

    if (donation.assignedVolunteer) {
      return res.status(400).json({ success: false, message: 'A volunteer is already assigned' });
    }

    donation.assignedVolunteer = req.user._id;
    donation.volunteerName = req.user.name;
    donation.status = 'picked_up';
    await donation.save();

    await Notification.create({
      userId: donation.donorId,
      title: 'Volunteer Assigned!',
      message: `${req.user.name} is picking up your donation of ${donation.foodName}.`,
      type: 'info',
      category: 'delivery',
      relatedDonationId: donation._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('volunteer:assigned', { donationId: donation._id, volunteerName: req.user.name });
    }

    res.json({ success: true, message: 'Delivery accepted!', donation });
  } catch (err) {
    next(err);
  }
};

// @desc   Mark donation as delivered
// @route  PUT /api/donations/:id/deliver
// @access Private (Volunteer)
const markDelivered = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.assignedVolunteer?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }

    donation.status = 'delivered';
    donation.deliveredAt = new Date();
    await donation.save();

    await Notification.create({
      userId: donation.donorId,
      title: 'Delivery Complete! ✅',
      message: `Your donation of ${donation.foodName} has been successfully delivered!`,
      type: 'success',
      category: 'delivery',
      relatedDonationId: donation._id,
    });

    const io = req.app.get('io');
    if (io) io.emit('delivery:completed', { donationId: donation._id });

    res.json({ success: true, message: 'Marked as delivered!', donation });
  } catch (err) {
    next(err);
  }
};

// @desc   Get donation stats
// @route  GET /api/donations/stats
// @access Private
const getDonationStats = async (req, res, next) => {
  try {
    const user = req.user;
    let matchQuery = {};

    if (user.role === 'donor') matchQuery.donorId = user._id;
    if (user.role === 'ngo') matchQuery.acceptedByNgo = user._id;
    if (user.role === 'volunteer') matchQuery.assignedVolunteer = user._id;

    const stats = await Donation.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = { total: 0, pending: 0, accepted: 0, rejected: 0, cancelled: 0, delivered: 0, picked_up: 0 };
    stats.forEach(s => {
      result[s._id] = s.count;
      result.total += s.count;
    });

    res.json({ success: true, stats: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDonation, getDonations, getDonationById,
  cancelDonation, acceptDonation, rejectDonation,
  assignVolunteer, markDelivered, getDonationStats,
};
