import { useEffect, useState } from 'react';

/** Images come from a third-party CDN that may not outlive the app — degrade, never break. */
export const IconWithFallback = ({
  src,
  alt,
  className = 'size-10 shrink-0 object-contain',
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return <div aria-hidden className={`rounded-full bg-slate-200 dark:bg-slate-700 ${className}`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={96}
      height={96}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
