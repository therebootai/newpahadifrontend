import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";

type MenuItemProps = {
  title: string;
  image: string | StaticImageData;
  href?: string;
  onClick?: () => void;
};

export default function MenuItem({ title, image, href, onClick }: MenuItemProps) {
  return (
    <Link 
      href={href || `/category/${title.toLowerCase().replace(/\s+/g, '-')}`} 
      onClick={onClick}
      className="group relative flex items-center gap-2 px-5 py-1 pb-2 cursor-pointer"
    >
      <Image
        height={20}
        width={20}
        src={image}
        alt={title}
        className="w-4 h-4"
      />

      <p className="text-md text-gray-700 transition-all duration-300 group-hover:text-amber-500">
        {title}
      </p>

      <span className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-amber-500 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
    </Link>
  );
}
