import { Alert, View, TouchableOpacity, TextInput, Text } from 'react-native'
import { useState } from 'react'
import { useAuth } from '@/utils/AuthProvider'
import { Ionicons } from '@expo/vector-icons'

type InputFieldProps = {
  label: string
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
}

const InputField = ({ label, value, onChangeText, placeholder, secureTextEntry = false }: InputFieldProps) => {
  const [hidePassword, setHidePassword] = useState(true)

  return (
    <View className="mb-4 w-full">
      <Text className="mb-2 text-sm font-bold text-foreground">{label}</Text>
      <View className="flex-row items-center rounded-lg border border-border bg-input px-3 py-2">
        <TextInput
          className="min-w-0 flex-1 text-foreground placeholder:text-foregroundMuted"
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && hidePassword}
          autoCapitalize="none"
        />
        {secureTextEntry ? (
          <TouchableOpacity
            className="ml-2 p-1"
            onPress={() => setHidePassword(!hidePassword)}
            accessibilityLabel={hidePassword ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidePassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

const RegisterScreen = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { signUp } = useAuth()

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Please enter the complete register details")
      return
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match")
      return
    }
    try {
      await signUp(email, password)
      Alert.alert('Success', 'Account created')
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message)
    }
  }

  return (
    <View className="w-full">
      <InputField
        label="Name"
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />
      <InputField
        label="Email"
        placeholder="email@address.com"
        value={email}
        onChangeText={setEmail}
      />
      <InputField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <InputField
        label="Confirm password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity
        className="w-full items-center rounded-lg bg-primary px-4 py-3 active:opacity-80"
        onPress={handleRegister}
      >
        <Text className="font-bold text-primaryForeground">Create account</Text>
      </TouchableOpacity>
    </View>
  )
}

export default RegisterScreen