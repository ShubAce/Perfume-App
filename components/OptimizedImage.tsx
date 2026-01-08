"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
	fallbackSrc?: string;
	timeout?: number;
	fallbackIcon?: React.ReactNode;
}

const DEFAULT_FALLBACK = "/images/placeholder-perfume.png";

export default function OptimizedImage({
	src,
	alt,
	fallbackSrc = DEFAULT_FALLBACK,
	timeout = 500,
	fallbackIcon,
	className,
	...props
}: OptimizedImageProps) {
	const [imgSrc, setImgSrc] = useState(src);
	const [isLoading, setIsLoading] = useState(true);
	const [showFallback, setShowFallback] = useState(false);
	const [timedOut, setTimedOut] = useState(false);

	useEffect(() => {
		setImgSrc(src);
		setIsLoading(true);
		setShowFallback(false);
		setTimedOut(false);

		// Set timeout for slow loading images
		const timer = setTimeout(() => {
			if (isLoading) {
				setTimedOut(true);
			}
		}, timeout);

		return () => clearTimeout(timer);
	}, [src, timeout]);

	const handleLoad = () => {
		setIsLoading(false);
		setTimedOut(false);
	};

	const handleError = () => {
		setIsLoading(false);
		setShowFallback(true);
		setImgSrc(fallbackSrc);
	};

	// Show fallback icon/placeholder while loading or on error
	if ((isLoading && timedOut) || showFallback) {
		if (fallbackIcon) {
			return <div className={`flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100 ${className}`}>{fallbackIcon}</div>;
		}

		// If we have a fallback src, try to show it
		if (showFallback || timedOut) {
			return (
				<div className={`relative flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100 ${className}`}>
					<div className="text-4xl">🧴</div>
					{isLoading && !showFallback && (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
						</div>
					)}
				</div>
			);
		}
	}

	return (
		<>
			{isLoading && (
				<div className={`absolute inset-0 flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100 z-10 ${className}`}>
					<div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
				</div>
			)}
			<Image
				{...props}
				src={imgSrc}
				alt={alt}
				className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
				onLoad={handleLoad}
				onError={handleError}
			/>
		</>
	);
}
