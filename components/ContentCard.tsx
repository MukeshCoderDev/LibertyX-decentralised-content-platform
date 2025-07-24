import React, { useState } from 'react';
import { ContentCardData, Page, NavigationProps } from '../types';
import HeartIcon from './icons/HeartIcon';

interface ContentCardProps extends NavigationProps {
  item: ContentCardData;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, onNavigate }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div
      className="relative aspect-[9/16] w-full bg-card rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-[0_0_20px_5px_rgba(255,0,80,0.3)] hover:-translate-y-2"
      onClick={() => onNavigate(Page.Watch)}
    >
      <img
        src={item.thumbnail}
        alt={item.creatorName}
        onLoad={() => setIsImageLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isImageLoaded ? 'blur-0 scale-100' : 'blur-lg scale-110'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

      {/* Price Tag */}
      <div className="absolute top-4 right-4 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
        ${item.price.toFixed(2)}
      </div>

      {/* Like Count */}
      <div
        className="absolute top-4 left-4 flex items-center gap-2 text-white bg-black/40 p-2 rounded-full cursor-pointer transition-colors"
        onClick={handleLike}
      >
        <HeartIcon className={`w-6 h-6 ${isLiked ? 'text-primary' : 'text-white'}`} />
        <span className="font-bold text-sm">{likeCount.toLocaleString()}</span>
      </div>

      {/* Creator Info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        <img src={item.creatorAvatar} alt={item.creatorName} className="w-12 h-12 rounded-full border-2 border-primary object-cover" />
        <div>
          <h3 className="font-satoshi font-bold text-white text-lg">{item.creatorName}</h3>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
