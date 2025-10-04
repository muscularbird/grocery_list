import WheelPicker from '@quidone/react-native-wheel-picker';
import { Modal, Pressable, TextInput, View, Text } from "react-native";
import { Item } from '@/app/main/home';
import { supabase } from '@/utils/supabase';
import { useState, useEffect, useMemo } from "react";

const data = [...Array(100).keys()].map((index) => ({
    value: index,
    label: index.toString(),
}))

export default function EditAddModal({ modalVisible, setModalVisible, itemId, setItemId, items, setItems }: { modalVisible: boolean; setModalVisible: Function; itemId: number; setItemId: Function; items: Item[]; setItems: Function }) {
    const [itemName, setItemName] = useState<string>('' + (itemId !== -1 ? items.find(item => item.id === Number(itemId))?.name : ''));
    const [quantity, setQuantity] = useState<number>(itemId !== -1 ? (items.find(item => item.id === Number(itemId))?.quantity || 1) : 1);
  const selectedItem = useMemo(
    () => items.find(item => item.id === Number(itemId)) ?? null,
    [items, itemId]
  );

  // update state when a new item is selected (or reset if new item)
  useEffect(() => {
    if (itemId !== -1 && selectedItem) {
      setItemName(selectedItem.name);
      setQuantity(selectedItem.quantity ?? 1);
    } else {
      setItemName('');
      setQuantity(1);
    }
  }, [itemId, selectedItem]);
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
            setItems((prevItems: any) => [...prevItems, data[0]]);
            setItemName('');
            setQuantity(1);
            setModalVisible(false);
        }
        } catch (error: any) {
        console.error('Error adding item:', error.message);
        }
    };

    const putItem = async () => {
        if (itemName.trim() === '') {
        return;
        }
        
        try {
        const { data, error } = await supabase
            .from('items')
            .update([{ name: itemName, quantity, purchased: false }])
            .eq('id', itemId)
            .select();
            
        if (error) {
            console.error('Error modifying item:', error.message);
            return;
        }
        if (data && data.length > 0) {
            items = items.map((item) => (item.id === itemId ? data[0] : item));
            setItems(items);
            setItemId(-1);
            setItemName('');
            setQuantity(1);
            setModalVisible(false);
            console.log('update item', itemId);
        }
        } catch (error: any) {
        console.error('Error modifying item:', error.message);
        }
    };


    return (
        <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible || itemId !== -1}
        onRequestClose={() => {
            // just close without saving
            setModalVisible(false);
            setItemId(-1);
        }}
        >
        <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-4/5 h-60 bg-white rounded-3xl items-center p-4 flex-col justify-between">
            <View className="flex-row justify-between w-full items-center m-auto">
            <TextInput
                className="w-46 h-20 text-3xl px-3 mb-4"
                placeholder="Item name"
                onChangeText={setItemName}
                value={itemName}
            />
            <WheelPicker
                data={data}
                value={quantity}
                onValueChanged={({ item: { value } }) => setQuantity(value)}
                enableScrollByTapOnItem={true}
                width={80}
                itemHeight={20}
            />
            </View>
            <Pressable
                className="mt-4 bg-blue-900 px-6 py-2 rounded-full"
                onPress={() => {
                    if (itemId === -1) {
                        addItem();
                    } else {
                        putItem();
                    }
                }}
                >
                <Text className="text-white text-lg">Save</Text>
            </Pressable>
            </View>
        </View>
        </Modal>
    );
}