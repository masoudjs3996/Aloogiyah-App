import RegisterFarmForm from "@/design-system/organisms/dashbord/RegisterFarmForm";
import { getProvinces } from "@/lib/actions/city";

const RegisterFarm = async () => {
  const provinces = await getProvinces();
  console.log(provinces);
  return (
    <div className="max-w-md mx-auto p-4 space-y-6 w-full">
      <RegisterFarmForm provinces={provinces} />
    </div>
  );
};

export default RegisterFarm;
