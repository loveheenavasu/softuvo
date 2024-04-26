import AddressForm from "@/ui/forms/AddressForm";
import SideBar from "@/ui/sidebar/SideBar";
import { getAllPanels, PanelData } from "./actions/getAllPanels";


export default async function Home() {
  const getAllPanel: PanelData | undefined = await getAllPanels();
  
  return (
    <main className="relative">
      <AddressForm />
      <div className="absolute top-9 right-2">
      {getAllPanel ? <SideBar getAllPanel={getAllPanel} /> : null}
      </div>
    </main>
  );
}
