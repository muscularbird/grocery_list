import { View } from "react-native";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
import DraggableFlatList from 'react-native-draggable-flatlist';
import renderItem from '@/components/renderItem';

export interface Item {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const getItems = async () => {
      try {
        const { data: items, error } = await supabase.from('items').select();

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

  return (
    <View>
        <DraggableFlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => (item.id).toString()}
          onDragEnd={({ data }) => setItems(data)}
        />
    </View>
  );
}
