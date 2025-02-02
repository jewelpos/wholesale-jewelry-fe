import Image from "next/image";

type Props = {
  width?: number;
  height?: number;
};

const LogoWhite = ({ width = 150, height = 45 }: Props) => {
  return (
    <Image
      src="/assets/img/logo-white.png"
      alt="Application logo"
      width={width}
      height={height}
    />
  );
};

export default LogoWhite;
