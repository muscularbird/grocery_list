import { useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/utils/supabase'
import showToast from '@/utils/showToast'

export default function Auth() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function signInWithEmail() {
    setMessage('Signing in...')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
        Alert.alert(error.message)
        showToast('error', 'Error', error.message)
        return
      }

      setMessage('Signed in successfully.')
      showToast('success', 'Success', 'Signed in successfully.')
      router.replace('/main/home')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.'
      setMessage(message)
      Alert.alert(message)
      showToast('error', 'Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="w-full">
      <View className="mb-4 w-full">
        <Text className="text-foreground text-sm font-bold mb-2">Email</Text>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-foregroundMuted"
        />
      </View>
      <View className="mb-6 w-full">
        <Text className="text-foreground text-sm font-bold mb-2">Password</Text>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize="none"
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-foregroundMuted"
        />
      </View>
      {message ? <Text className="mb-4 text-error">{message}</Text> : null}
      <View className="mb-2 w-full">
        <Pressable
          className="w-full items-center rounded-lg bg-primary px-4 py-3 active:opacity-80 disabled:opacity-50"
          onPress={signInWithEmail}
          disabled={loading}
        >
          <Text className="font-bold text-primaryForeground">
            {loading ? 'Signing in...' : 'Sign in'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}