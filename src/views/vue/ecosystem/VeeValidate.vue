<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const loginFormExample = `<!-- 實戰 1：登入表單 -->
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = toTypedSchema(z.object({
  email:    z.string().email('請輸入有效的 Email'),
  password: z.string().min(8, '密碼至少需要 8 個字元'),
}))

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
})

const [email, emailAttrs]       = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  // values 完全型別安全：{ email: string, password: string }
  await login(values.email, values.password)
})
<\/script>

<template>
  <form @submit="onSubmit">
    <div>
      <input v-model="email" v-bind="emailAttrs" type="email" placeholder="Email" />
      <span class="error">{{ errors.email }}</span>
    </div>
    <div>
      <input v-model="password" v-bind="passwordAttrs" type="password" placeholder="密碼" />
      <span class="error">{{ errors.password }}</span>
    </div>
    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? '登入中...' : '登入' }}
    </button>
  </form>
</template>`

const registerFormExample = `<!-- 實戰 2：完整註冊表單（含確認密碼 + 非同步驗證）-->
<script setup lang="ts">
import { z } from 'zod'

const schema = toTypedSchema(z.object({
  username: z.string()
    .min(3, '使用者名稱至少 3 個字元')
    .max(20, '使用者名稱最多 20 個字元')
    .regex(/^[a-zA-Z0-9_]+$/, '只能包含英文、數字和底線'),

  email: z.string()
    .email('請輸入有效的 Email')
    .refine(async (email) => {
      // 非同步驗證：檢查 Email 是否已被使用
      const { available } = await $fetch('/api/check-email', {
        method: 'POST',
        body: { email },
      })
      return available
    }, 'Email 已被使用'),

  password: z.string()
    .min(8, '密碼至少 8 個字元')
    .regex(/[A-Z]/, '密碼需包含大寫字母')
    .regex(/[0-9]/, '密碼需包含數字'),

  confirmPassword: z.string(),

  agreeToTerms: z.boolean().refine(val => val === true, '請同意服務條款'),
}).refine(data => data.password === data.confirmPassword, {
  message: '密碼不一致',
  path: ['confirmPassword'],  // 錯誤顯示在 confirmPassword 欄位
}))

const { defineField, handleSubmit, errors, isSubmitting, setFieldError } = useForm({
  validationSchema: schema,
})

const onSubmit = handleSubmit(async (values) => {
  try {
    await registerUser(values)
    navigateTo('/login')
  } catch (e: unknown) {
    // 伺服器端錯誤回寫到欄位
    if (e.data?.field) {
      setFieldError(e.data.field, e.data.message)
    }
  }
})
<\/script>`

const arrayFieldsExample = `<!-- 實戰 3：動態陣列欄位（工作經歷表單）-->
<script setup lang="ts">
import { useForm, useFieldArray } from 'vee-validate'
import { z } from 'zod'

const schema = toTypedSchema(z.object({
  experiences: z.array(z.object({
    company: z.string().min(1, '必填'),
    role:    z.string().min(1, '必填'),
    years:   z.number().min(0).max(50),
  })).min(1, '至少填寫一筆工作經歷'),
}))

const { handleSubmit } = useForm({ validationSchema: schema })

// useFieldArray — 操作陣列欄位
const { fields, push, remove } = useFieldArray('experiences')
<\/script>

<template>
  <form @submit="onSubmit">
    <div v-for="(field, index) in fields" :key="field.key">
      <input :name="\`experiences[\${index}].company\`" placeholder="公司名稱" />
      <input :name="\`experiences[\${index}].role\`"    placeholder="職位" />
      <input :name="\`experiences[\${index}].years\`"   type="number" placeholder="年資" />
      <button type="button" @click="remove(index)">刪除</button>
    </div>
    <button type="button" @click="push({ company: '', role: '', years: 0 })">
      + 新增工作經歷
    </button>
    <button type="submit">送出</button>
  </form>
</template>`

const shadcnFormExample = `<!-- 實戰 4：搭配 shadcn-vue Form 組件 -->
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import {
  FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = toTypedSchema(z.object({
  username: z.string().min(2).max(50),
  bio:      z.string().max(160).optional(),
}))

const form = useForm({ validationSchema: formSchema })
const onSubmit = form.handleSubmit(async (values) => {
  await updateProfile(values)
})
<\/script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <!-- FormField 自動處理 v-bind、錯誤顯示、aria 屬性 -->
    <FormField v-slot="{ componentField }" name="username">
      <FormItem>
        <FormLabel>使用者名稱</FormLabel>
        <FormControl>
          <Input v-bind="componentField" placeholder="輸入使用者名稱" />
        </FormControl>
        <FormDescription>這是你的公開顯示名稱</FormDescription>
        <FormMessage />  <!-- 自動顯示驗證錯誤 -->
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="bio">
      <FormItem>
        <FormLabel>個人簡介</FormLabel>
        <FormControl>
          <Textarea v-bind="componentField" placeholder="介紹一下自己..." />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit" :disabled="form.isSubmitting.value">
      儲存設定
    </Button>
  </form>
</template>`
</script>

<template>
  <div class="content-wrapper">
    <h1>VeeValidate + Zod 實戰</h1>
    <p class="page-subtitle">型別安全的表單驗證 — 登入、動態欄位、非同步驗證、shadcn-vue 整合</p>

    <div class="info-box info">
      <div class="info-box-title">📌 安裝</div>
      <p>
        <code>npm install vee-validate @vee-validate/zod zod</code><br>
        搭配 shadcn-vue 還需要：<code>npx shadcn-vue@latest add form</code>
      </p>
    </div>

    <h2>實戰 1：登入表單</h2>
    <p>最基本的表單驗證，使用 <code>defineField</code> 綁定欄位，<code>handleSubmit</code> 確保送出前已通過驗證。</p>
    <CodeBlock lang="html" filename="LoginForm.vue" :code="loginFormExample" />

    <h2>實戰 2：完整註冊表單</h2>
    <p>
      包含：跨欄位驗證（確認密碼）、<code>refine</code> 自訂規則、非同步 Email 唯一性驗證、伺服器端錯誤回寫。
    </p>
    <CodeBlock lang="html" filename="RegisterForm.vue" :code="registerFormExample" />

    <h2>實戰 3：動態陣列欄位</h2>
    <p><code>useFieldArray</code> 管理可動態新增/刪除的欄位群組，Schema 也支援 Zod array validation。</p>
    <CodeBlock lang="html" filename="ExperienceForm.vue" :code="arrayFieldsExample" />

    <h2>實戰 4：搭配 shadcn-vue Form 組件</h2>
    <p>
      shadcn-vue 的 <code>FormField</code> 自動處理欄位綁定、錯誤顯示和 aria 無障礙屬性，
      讓表單程式碼更簡潔語意化。
    </p>
    <CodeBlock lang="html" filename="ProfileForm.vue（shadcn-vue 整合）" :code="shadcnFormExample" />

    <h2>Zod Schema 常用模式速查</h2>
    <CodeBlock lang="typescript" filename="Zod 常用驗證方式" :code="`import { z } from 'zod'

// 字串驗證
z.string().min(1, '必填')
z.string().email('格式錯誤')
z.string().url('格式錯誤')
z.string().regex(/pattern/, '格式不符')
z.string().trim().min(1)    // 先 trim 再驗證

// 數字驗證
z.number().min(0).max(100)
z.number().int('必須為整數')
z.coerce.number()           // 字串自動轉數字（input value 是 string）

// 可選欄位
z.string().optional()       // undefined OK
z.string().nullable()       // null OK
z.string().nullish()        // undefined 或 null 都 OK

// 選擇型別
z.enum(['admin', 'user', 'guest'])
z.union([z.string(), z.number()])

// 物件
z.object({ ... }).partial()           // 所有欄位可選
z.object({ ... }).pick({ name: true }) // 只取部分欄位

// 陣列
z.array(z.string()).min(1, '至少一筆')
z.array(z.string()).max(5, '最多 5 筆')

// 自訂驗證
z.string().refine(val => val.startsWith('NTW'), '需以 NTW 開頭')
z.string().superRefine((val, ctx) => {
  if (val.includes('bad-word')) {
    ctx.addIssue({ code: 'custom', message: '包含不適當內容' })
  }
})`" />

    <PageNav
      :prev="{ path: '/vue/ecosystem/vitest', label: 'Vitest 測試實戰' }"
      :next="{ path: '/vue/ecosystem/i18n', label: 'Vue I18n 實戰' }"
    />
  </div>
</template>
