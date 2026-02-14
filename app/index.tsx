import { GestureHandlerRootView } from "react-native-gesture-handler";
import WarehouseScene from "../src/components/WarehouseScene";

export default function Home() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WarehouseScene />
    </GestureHandlerRootView>
  );
}
