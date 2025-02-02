import Image from "next/image";

type Props = {
  width?: number;
  height?: number;
};

const Logo = ({ width = 150, height = 45 }: Props) => {
  return (
    <Image
      src="/assets/img/logo.png"
      alt="Application logo"
      width={width}
      height={height}
    />
  );
};

export default Logo;
