import { View, Modal, TextInput } from "react-native";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
import DraggableFlatList from 'react-native-draggable-flatlist';
import RenderItem from '@/components/renderItem';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import EditAddModal from "@/components/editAddModal";

export interface Item {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemId, setItemId] = useState(-1);
  const [data, setData] = useState(items);

  useEffect(() => {
    const getItems = async () => {
      try {
        const { data: items, error } = await supabase.from('items').select();
        items?.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)); // sort by rank

        if (error) {
          console.error('Error fetching todos:', error.message);
          return;
        }

        if (items && items.length > 0) {
          console.log('Fetched items:', items);
          setItems(items);
        }
      } catch (error: any) {
        console.error('Error fetching todos:', error.message);
      }
    };

    getItems();
  }, []);

    const handleDragEnd = async ({ data }: { data: Item[] }) => {
    setData(data);
    setItems(data);

    // Update rank in DB
    const updates = data.map((item, index) => ({
      id: item.id,
      rank: index + 1, // rank starting from 1
      name: item.name,
    }));

    try {
      const { error } = await supabase
        .from("items")
        .upsert(updates, { onConflict: "id" }); // update based on id

      if (error) {
        console.error("Error updating ranks:", error.message);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  return (
    <View className="flex-1">
        <DraggableFlatList
          data={items}
          renderItem={(params) => (
            <RenderItem {...params} setItems={setItems} itemId={itemId} setItemId={setItemId}/>
          )}
          keyExtractor={(item) => (item.id).toString()}
          onDragEnd={handleDragEnd}
        />
      <EditAddModal modalVisible={modalVisible} setModalVisible={setModalVisible} itemId={itemId} setItemId={setItemId} items={items} setItems={setItems}/>
      <View className="absolute bottom-32 right-16 bg-blue-900 rounded-full p-4" onTouchStart={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={30} color="white" />
      </View>
    </View>
  );
}
