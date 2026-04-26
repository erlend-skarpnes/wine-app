interface Props {
  src: string
  alt?: string
  className?: string
}

export default function WineImage({ src, alt, className = 'w-20 h-auto self-center rounded' }: Props) {
  return <img src={src} alt={alt} className={className} />
}
