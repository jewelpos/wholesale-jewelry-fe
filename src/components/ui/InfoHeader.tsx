type Props = {
  title: string;
  para: string;
};

const InfoHeader = ({ title, para }: Props) => {
  return (
    // <div className="card bg-none">
    //   <div className="card-body ">
    <div className="container mt-3 mb-3">
      <h1 className="mb-2 text-primary">{title}</h1>
      <p className=" mb-0 text-secondary">{para}</p>
    </div>
    //   </div>
    // </div>
  );
};

export default InfoHeader;
