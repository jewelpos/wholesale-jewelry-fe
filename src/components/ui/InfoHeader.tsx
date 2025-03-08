type Props = {
  title: string;
  para?: string;
};

const InfoHeader = ({ title, para }: Props) => {
  return (
    <div className="container mb-4 mt-3">
      <h1 className="mb-2 text-primary">{title}</h1>
      {para && <p className=" mb-0 text-secondary">{para}</p>}
    </div>
  );
};

export default InfoHeader;
