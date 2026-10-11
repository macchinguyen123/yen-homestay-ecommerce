"use client"
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react';
import './interactive-bento-gallery.css';

// MediaItemType defines the structure of a media item
export interface MediaItemType {
    id: number;
    type: string;
    title: string;
    desc: string;
    url: string;
    span: string;
}

// MediaItem component renders either a video or image based on item.type
export const MediaItem = ({ item, className, onClick }: { item: MediaItemType, className?: string, onClick?: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null); // Reference for video element
    const [isInView, setIsInView] = useState(false); // To track if video is in the viewport
    const [isBuffering, setIsBuffering] = useState(true);  // To track if video is buffering

    // Intersection Observer to detect if video is in view and play/pause accordingly
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                setIsInView(entry.isIntersecting); // Set isInView to true if the video is in view
            });
        }, options);

        if (videoRef.current) {
            observer.observe(videoRef.current); // Start observing the video element
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current); // Clean up observer when component unmounts
            }
        };
    }, []);

    // Handle video play/pause based on whether the video is in view or not
    useEffect(() => {
        let mounted = true;

        const handleVideoPlay = async () => {
            if (!videoRef.current || !isInView || !mounted) return; // Don't play if video is not in view or component is unmounted

            try {
                if (videoRef.current.readyState >= 3) {
                    setIsBuffering(false);
                    await videoRef.current.play(); // Play the video if it's ready
                } else {
                    setIsBuffering(true);
                    await new Promise((resolve) => {
                        if (videoRef.current) {
                            videoRef.current.oncanplay = resolve; // Wait until the video can start playing
                        }
                    });
                    if (mounted) {
                        setIsBuffering(false);
                        await videoRef.current.play();
                    }
                }
            } catch (error) {
                console.warn("Video playback failed:", error);
            }
        };

        if (isInView) {
            handleVideoPlay();
        } else if (videoRef.current) {
            videoRef.current.pause();
        }

        return () => {
            mounted = false;
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
            }
        };
    }, [isInView]);

    // Render either a video or image based on item.type
    if (item.type === 'video') {
        return (
            <div className={`${className} relative overflow-hidden`}>
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    onClick={onClick}
                    playsInline
                    muted
                    loop
                    preload="auto"
                    style={{
                        opacity: isBuffering ? 0.8 : 1,
                        transition: 'opacity 0.2s',
                        transform: 'translateZ(0)',
                        willChange: 'transform',
                    }}
                >
                    <source src={item.url} type="video/mp4" />
                </video>
                {isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <img
            src={item.url} // Image source URL
            alt={item.title} // Alt text for the image
            className={`${className} object-cover cursor-pointer`} // Style the image
            onClick={onClick} // Trigger onClick when the image is clicked
            loading="lazy" // Lazy load the image for performance
            decoding="async" // Decode the image asynchronously
        />
    );
};

// GalleryModal component displays the selected media item in a modal
export interface GalleryModalProps {
    selectedItem: MediaItemType;
    isOpen: boolean;
    onClose: () => void;
    setSelectedItem: (item: MediaItemType | null) => void;
    mediaItems: MediaItemType[]; // List of media items to display in the modal
}

export const GalleryModal = ({ selectedItem, isOpen, onClose, setSelectedItem, mediaItems }: GalleryModalProps) => {
    const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });  // Track the position of the dockable panel

    // Handle Keyboard Navigation (Esc to close, Arrow keys to navigate)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight') {
                const currentIdx = mediaItems.findIndex(i => i.id === selectedItem?.id);
                if (currentIdx !== -1 && currentIdx < mediaItems.length - 1) {
                    setSelectedItem(mediaItems[currentIdx + 1]);
                } else if (currentIdx === mediaItems.length - 1) {
                    setSelectedItem(mediaItems[0]);
                }
            } else if (e.key === 'ArrowLeft') {
                const currentIdx = mediaItems.findIndex(i => i.id === selectedItem?.id);
                if (currentIdx > 0) {
                    setSelectedItem(mediaItems[currentIdx - 1]);
                } else if (currentIdx === 0) {
                    setSelectedItem(mediaItems[mediaItems.length - 1]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedItem, mediaItems, onClose, setSelectedItem]);

    if (!isOpen) return null; // Return null if the modal is not open

    return (
        <>
            {/* Backdrop Dimmer */}
            <div 
                className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md bento-fixed-overlay"
                onClick={onClose} 
            />

            {/* Main Modal */}
            <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                }}
                className="fixed inset-0 w-full min-h-screen sm:h-[90vh] md:h-[600px] backdrop-blur-lg 
                          rounded-none sm:rounded-lg md:rounded-xl overflow-hidden z-50 flex items-center justify-center pointer-events-none bento-modal-container"
            >
                {/* Main Content */}
                <div className="h-full w-full flex flex-col justify-center items-center pointer-events-auto">
                    <div className="flex-1 w-full p-2 sm:p-3 md:p-4 flex items-center justify-center bg-gray-900/40">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedItem.id}
                                className="relative w-full aspect-[16/9] max-w-[95%] sm:max-w-[85%] md:max-w-3xl 
                                         h-auto max-h-[70vh] rounded-lg overflow-hidden shadow-2xl bg-black bento-modal-content-wrap"
                                initial={{ y: 20, scale: 0.97 }}
                                animate={{
                                    y: 0,
                                    scale: 1,
                                    transition: {
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                        mass: 0.5
                                    }
                                }}
                                exit={{
                                    y: 20,
                                    scale: 0.97,
                                    transition: { duration: 0.15 }
                                }}
                            >
                                <MediaItem item={selectedItem} className="w-full h-full object-contain bg-black" onClick={onClose} />
                                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 
                                              bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none bento-overlay-caption">
                                    <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold">
                                        {selectedItem.title}
                                    </h3>
                                    <p className="text-white/80 text-xs sm:text-sm mt-1">
                                        {selectedItem.desc}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Close Button */}
                <motion.button
                    className="absolute top-4 right-4 sm:top-5 sm:right-6 
                              p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white
                              text-sm backdrop-blur-md shadow-lg pointer-events-auto cursor-pointer bento-modal-close-btn"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Đóng xem ảnh"
                >
                    <X className='w-5 h-5' />
                </motion.button>
            </motion.div>

            {/* Draggable Dock */}
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                initial={false}
                animate={{ x: dockPosition.x, y: dockPosition.y }}
                onDragEnd={(_, info) => {
                    setDockPosition(prev => ({
                        x: prev.x + info.offset.x,
                        y: prev.y + info.offset.y
                    }));
                }}
                className="fixed z-50 right-6 bottom-6 touch-none bento-modal-dock"
            >
                <motion.div
                    className="relative rounded-2xl bg-black/60 backdrop-blur-xl 
                             border border-white/20 shadow-2xl p-1.5
                             cursor-grab active:cursor-grabbing bento-modal-dock-inner"
                >
                    <div className="bento-dock-items-row flex flex-row items-center space-x-1 sm:space-x-2 px-2 py-1 overflow-x-auto max-w-[90vw]">
                        {mediaItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item);
                                }}
                                style={{
                                    zIndex: selectedItem.id === item.id ? 30 : mediaItems.length - index,
                                }}
                                className={`
                                    relative group
                                    w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0 
                                    rounded-xl overflow-hidden 
                                    cursor-pointer hover:z-20 border transition-all bento-dock-thumb
                                    ${selectedItem.id === item.id
                                        ? 'ring-2 ring-emerald-400 border-emerald-400 scale-110 shadow-lg active'
                                        : 'border-white/20 opacity-80 hover:opacity-100 hover:ring-2 hover:ring-white/50'}
                                `}
                                initial={{ rotate: index % 2 === 0 ? -6 : 6 }}
                                animate={{
                                    scale: selectedItem.id === item.id ? 1.15 : 1,
                                    rotate: selectedItem.id === item.id ? 0 : index % 2 === 0 ? -4 : 4,
                                    y: selectedItem.id === item.id ? -6 : 0,
                                }}
                                whileHover={{
                                    scale: 1.25,
                                    rotate: 0,
                                    y: -8,
                                    transition: { type: "spring", stiffness: 400, damping: 25 }
                                }}
                            >
                                <MediaItem item={item} className="w-full h-full object-cover" onClick={() => setSelectedItem(item)} />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
                                {selectedItem.id === item.id && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute -inset-2 bg-emerald-400/30 blur-lg"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
};


export interface InteractiveBentoGalleryProps {
    mediaItems: MediaItemType[]
    title: string
    description: string
    isOpenModal?: boolean
    onCloseModal?: () => void
    initialActiveIndex?: number
}

const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = ({ 
    mediaItems, 
    title, 
    description,
    isOpenModal = false,
    onCloseModal,
    initialActiveIndex = 0
}) => {
    const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(
        isOpenModal ? (mediaItems[initialActiveIndex] || mediaItems[0] || null) : null
    );
    const [items, setItems] = useState(mediaItems);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setItems(mediaItems);
        if (isOpenModal && mediaItems.length > 0) {
            setSelectedItem(mediaItems[initialActiveIndex] || mediaItems[0]);
        }
    }, [mediaItems, isOpenModal, initialActiveIndex]);

    const handleClose = () => {
        setSelectedItem(null);
        if (onCloseModal) {
            onCloseModal();
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {title && (
                <div className="mb-8 text-center">
                    <motion.h1
                        className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent 
                                 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900
                                 dark:from-white dark:via-gray-200 dark:to-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {title}
                    </motion.h1>
                    {description && (
                        <motion.p
                            className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {description}
                        </motion.p>
                    )}
                </div>
            )}
            
            <AnimatePresence mode="wait">
                {selectedItem ? (
                    <GalleryModal
                        selectedItem={selectedItem}
                        isOpen={true}
                        onClose={handleClose}
                        setSelectedItem={setSelectedItem}
                        mediaItems={items}
                    />
                ) : (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 auto-rows-[60px]"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                    >
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layoutId={`media-${item.id}`}
                                className={`relative overflow-hidden rounded-xl cursor-move ${item.span}`}
                                onClick={() => !isDragging && setSelectedItem(item)}
                                variants={{
                                    hidden: { y: 50, scale: 0.9, opacity: 0 },
                                    visible: {
                                        y: 0,
                                        scale: 1,
                                        opacity: 1,
                                        transition: {
                                            type: "spring",
                                            stiffness: 350,
                                            damping: 25,
                                            delay: index * 0.05
                                        }
                                    }
                                }}
                                whileHover={{ scale: 1.02 }}
                                drag
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={1}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={(e, info) => {
                                    setIsDragging(false);
                                    const moveDistance = info.offset.x + info.offset.y;
                                    if (Math.abs(moveDistance) > 50) {
                                        const newItems = [...items];
                                        const draggedItem = newItems[index];
                                        const targetIndex = moveDistance > 0 ?
                                            Math.min(index + 1, items.length - 1) :
                                            Math.max(index - 1, 0);
                                        newItems.splice(index, 1);
                                        newItems.splice(targetIndex, 0, draggedItem);
                                        setItems(newItems);
                                    }
                                }}
                            >
                                <MediaItem
                                    item={item}
                                    className="absolute inset-0 w-full h-full"
                                    onClick={() => !isDragging && setSelectedItem(item)}
                                />
                                <motion.div
                                    className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4"
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                        <h3 className="relative text-white text-xs sm:text-sm md:text-base font-medium line-clamp-1">
                                            {item.title}
                                        </h3>
                                        <p className="relative text-white/70 text-[10px] sm:text-xs md:text-sm mt-0.5 line-clamp-2">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveBentoGallery;
