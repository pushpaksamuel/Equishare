import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, src, className = '' }) => {
  const getInitials = (nameStr: string) => {
    if (!nameStr) return '?';
    const names = nameStr.trim().split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const getBackgroundColor = (nameStr: string) => {
    const colors = [
        'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 
        'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
        'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    let hash = 0;
    if (!nameStr) return colors[0];
    for (let i = 0; i < nameStr.length; i++) {
        hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm select-none';
  
  if (src) {
    return (
        <img 
            src={src} 
            alt={name} 
            className={`w-10 h-10 rounded-full object-cover ${className}`}
        />
    );
  }

  return (
    <div className={`${baseClasses} ${getBackgroundColor(name)} ${className}`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;