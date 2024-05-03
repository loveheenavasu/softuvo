import AddressForm from "@/ui/forms/AddressForm";
import SideBar from "@/ui/sidebar/SideBar";
import { getAllPanels, PanelData } from "./actions/getAllPanels";

export default async function Home() {
  const getAllPanel: PanelData | undefined = await getAllPanels();

  return (
    <main className="relative h-screen">
      <AddressForm />
      {getAllPanel ? <SideBar getAllPanel={getAllPanel} /> : null}
    </main>
  );
}
