import RegisterFarmForm from "@/design-system/organisms/dashbord/RegisterFarmForm";
import { getProvinces } from "@/lib/actions/city";

const RegisterFarm = async () => {
  const provinces = await getProvinces();
  return (
    <div className=" mx-auto p-4 space-y-6 w-full">
      <RegisterFarmForm provinces={provinces} />
    </div>
  );
};

export default RegisterFarm;
