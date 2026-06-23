import Image from "next/image";
import React from "react";

type Props = {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
};

const Logo = ({ width = 787, height = 225, style }: Props) => {
  return (
    <Image
      src="/assets/img/logo.png"
      alt="JewelPOS logo"
      width={width}
      height={height}
      style={style}
    />
  );
};

export default Logo;
