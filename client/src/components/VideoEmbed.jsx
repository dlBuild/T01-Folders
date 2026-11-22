import { FiPlayCircle } from 'react-icons/fi';

/** Explanation video: YouTube/Vimeo embed or a direct video file. `video` = { kind, src } from the server. */
export default function VideoEmbed({ video, title }) {
  if (!video?.src) return null;
  return (
    <figure className="rounded-2xl overflow-hidden bg-navy-900 shadow-card">
      <div className="aspect-video">
        {video.kind === 'file' ? (
          <video className="w-full h-full" controls preload="metadata" src={video.src} />
        ) : (
          <iframe
            className="w-full h-full"
            src={video.src}
            title={title || 'Explanation video'}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
      <figcaption className="flex items-center gap-2 px-4 py-2.5 text-xs text-cream-soft/80">
        <FiPlayCircle /> {title || 'Prefer watching? Here is the explanation video.'}
      </figcaption>
    </figure>
  );
}
