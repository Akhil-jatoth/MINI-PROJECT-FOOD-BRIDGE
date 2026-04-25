import { useState, useRef } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProfileUpload = () => {
  const { user, updateUser } = useAuth();
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const src = preview
    || (user?.profilePhoto ? `/uploads/profiles/${user.profilePhoto}` : null)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=16a34a&color=fff&size=128`;

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('profilePhoto', file);
    try {
      const res = await authAPI.updateProfilePhoto(formData);
      updateUser({ profilePhoto: res.data.profilePhoto });
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo');
      setPreview(null);
    }
  };

  const handleRemove = async () => {
    try {
      await authAPI.removeProfilePhoto();
      setPreview(null);
      updateUser({ profilePhoto: null });
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <img
          src={src}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border-4 border-brand-500 shadow-lg"
        />
        <label
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          htmlFor="profileUploadInput"
        >
          <span className="text-white text-xs font-semibold">Edit</span>
        </label>
        <input id="profileUploadInput" type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handleChange} />
      </div>
      <div className="flex gap-2">
        <label htmlFor="profileUploadInput" className="text-xs btn-outline py-1.5 px-3 cursor-pointer">
          Change Photo
        </label>
        {(preview || user?.profilePhoto) && (
          <button onClick={handleRemove} className="text-xs text-red-500 hover:underline py-1.5 px-3">
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileUpload;
