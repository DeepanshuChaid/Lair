import { Button } from "../ui/button";
import Image from "next/image";

const GoogleOauthButton = (props: { label: string }) => {
  const { label } = props;
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleClick = () => {
    window.location.href = `${baseURL}/auth/google`;
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      type="button"
      className="w-full flex items-center justify-center gap-3 px-3 py-[25px] h-[56px]
                 bg-[#1A1A1A] border border-white/10 rounded-lg
                 shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_1px_4px_rgba(235,235,235,0.12)]
                 !text-white text-[16px]
                 hover:bg-black-50 active:bg-grey-800 active:shadow-[0_2px_2px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(235,235,235,0.12)]
                 transition-all duration-150 ease-in-out "
    >
      <Image src="./google.svg" height={25} width={20} alt="GOOGLE_LOGO" />
      {label} with Google
    </Button>
  );
};

export default GoogleOauthButton;

// flex flex-row justify-center items-center p-3 gap-3 
//              self-stretch
//             shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_1px_4px_rgba(235,235,235,0.12)]