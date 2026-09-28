
export default function Image({ imageValue, altText, className,}) {    
    return <img src={imageValue} alt={altText} className={className}  />
}