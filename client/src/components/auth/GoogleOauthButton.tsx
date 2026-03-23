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
      className="w-full flex items-center justify-center gap-3 px-3 py-[20px] h-[48px]
                 bg-white border border-[#E5E5E5] rounded-lg
                 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)]
                 !text-[#171717] text-[16px] font-medium
                 hover:bg-[#FAFAFA] hover:border-[#D1D1D1]
                 active:bg-[#F5F5F5] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]
                 transition-all duration-150 ease-in-out"
    >
      <Image src="/google.svg" height={25} width={20} alt="GOOGLE_LOGO" />
      {label} with Google
    </Button>
  );
};

export default GoogleOauthButton;