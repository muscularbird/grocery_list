import { View, Modal, TextInput } from "react-native";
import { supabase } from '@/utils/supabase';
import { useEffect, useState } from "react";
import DraggableFlatList from 'react-native-draggable-flatlist';
import RenderItem from '@/components/renderItem';
import WheelPicker from '@quidone/react-native-wheel-picker';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export interface Item {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

const data = [...Array(100).keys()].map((index) => ({
  value: index,
  label: index.toString(),
}))

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');

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

  const addItem = async () => {
    if (itemName.trim() === '') {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([{ name: itemName, quantity, purchased: false }])
        .select();
        
      if (error) {
        console.error('Error adding item:', error.message);
        return;
      }
      if (data && data.length > 0) {
        setItems((prevItems) => [...prevItems, data[0]]);
        setItemName('');
        setQuantity(1);
        setModalVisible(false);
      }
    } catch (error: any) {
      console.error('Error adding item:', error.message);
    }
  };

  return (
    <View className="flex-1">
        <DraggableFlatList
          data={items}
          renderItem={(params) => (
            <RenderItem {...params} setItems={setItems} />
          )}
          keyExtractor={(item) => (item.id).toString()}
          onDragEnd={({ data }) => setItems(data)}
        />
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
            addItem();
          }}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-4/5 h-40 bg-white rounded-3xl items-center p-4 flex-row justify-between">
              <TextInput className="w-38 h-16 border-gray-300 text-2xl mr-20"
                  placeholder="Item name" onChangeText={setItemName} value={itemName} scrollEnabled/>
                <WheelPicker
                  data={data}
                  value={quantity}
                  onValueChanged={({item: {value}}) => setQuantity(value)}
                  enableScrollByTapOnItem={true}
                  style={{marginRight: 20 }}
                  width={80}
                  itemHeight={40}
                />
            </View>
          </View>
        </Modal>
      <View className="absolute bottom-32 right-16 bg-blue-900 rounded-full p-4" onTouchStart={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={30} color="white" />
      </View>
    </View>
  );
}
