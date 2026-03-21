<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const setupExample = `# 1. 建立 Vite + Vue 3 + TypeScript 專案
npm create vite@latest my-app -- --template vue-ts
cd my-app

# 2. 安裝 Tailwind CSS（shadcn-vue 依賴）
npm install -D tailwindcss @tailwindcss/vite

# 3. 初始化 shadcn-vue（互動式設定）
npx shadcn-vue@latest init
# ✔ Which color would you like to use as base color? › Zinc
# ✔ Would you like to use CSS variables for colors? › Yes

# 4. 按需加入組件
npx shadcn-vue@latest add button
npx shadcn-vue@latest add input
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add form
npx shadcn-vue@latest add table
npx shadcn-vue@latest add dropdown-menu

# 組件會加入到 src/components/ui/ 目錄（程式碼完全屬於你）`

const themeExample = `/* src/assets/index.css — CSS 變數主題客製化 */
@import 'tailwindcss';

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;         /* 主色 */
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --accent: 240 4.8% 95.9%;
    --destructive: 0 84.2% 60.2%;    /* 危險色（紅色）*/
    --border: 240 5.9% 90%;
    --radius: 0.5rem;                 /* 圓角大小 */
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --border: 240 3.7% 15.9%;
  }
}`

const buttonDialogExample = `<!-- 實戰 1：Button + Dialog 確認對話框 -->
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

async function confirmDelete(id: number) {
  await deleteItem(id)
  toast({ title: '已刪除', description: '項目已成功刪除' })
}
<\/script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="destructive">刪除帳號</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogDescription>
          此操作無法復原，確定要刪除你的帳號嗎？
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">取消</Button>
        <Button variant="destructive" @click="confirmDelete(user.id)">
          確認刪除
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>`

const formExample = `<!-- 實戰 2：完整表單（Form + Input + Select + Switch）-->
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

const formSchema = toTypedSchema(z.object({
  displayName: z.string().min(2, '至少 2 個字元'),
  email:       z.string().email('請輸入有效的 Email'),
  role:        z.enum(['admin', 'user', 'viewer']),
  notifications: z.boolean(),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: { role: 'user', notifications: true },
})

const onSubmit = form.handleSubmit(async (values) => {
  await updateSettings(values)
  toast({ title: '設定已儲存', description: '你的偏好設定已更新' })
})
<\/script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <FormField v-slot="{ componentField }" name="displayName">
      <FormItem>
        <FormLabel>顯示名稱</FormLabel>
        <FormControl><Input v-bind="componentField" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="role">
      <FormItem>
        <FormLabel>角色</FormLabel>
        <Select v-bind="componentField">
          <FormControl>
            <SelectTrigger><SelectValue placeholder="選擇角色" /></SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="admin">管理員</SelectItem>
            <SelectItem value="user">一般使用者</SelectItem>
            <SelectItem value="viewer">觀覽者</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ value, handleChange }" name="notifications">
      <FormItem class="flex items-center gap-4">
        <FormControl>
          <Switch :checked="value" @update:checked="handleChange" />
        </FormControl>
        <div>
          <FormLabel>電子郵件通知</FormLabel>
          <FormDescription>接收重要的系統通知</FormDescription>
        </div>
      </FormItem>
    </FormField>

    <Button type="submit" :disabled="form.isSubmitting.value">儲存設定</Button>
  </form>
</template>`

const dataTableExample = `<!-- 實戰 3：DataTable（TanStack Table + shadcn-vue）-->
<script setup lang="ts">
import {
  useVueTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  createColumnHelper, FlexRender,
} from '@tanstack/vue-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface User { id: number; name: string; email: string; role: string }

const props = defineProps<{ data: User[] }>()

const columnHelper = createColumnHelper<User>()

const columns = [
  columnHelper.accessor('name', {
    header: '姓名',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
  columnHelper.accessor('role', {
    header: '角色',
    cell: info => h(Badge, { variant: 'outline' }, () => info.getValue()),
  }),
]

const globalFilter = ref('')
const sorting = ref([])

const table = useVueTable({
  get data() { return props.data },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get sorting() { return sorting.value },
    get globalFilter() { return globalFilter.value },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  initialState: { pagination: { pageSize: 10 } },
})
<\/script>

<template>
  <div>
    <Input v-model="globalFilter" placeholder="搜尋所有欄位..." class="mb-4" />

    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers" :key="header.id"
            class="cursor-pointer select-none"
            @click="header.column.toggleSorting()"
          >
            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- 分頁控制 -->
    <div class="flex items-center justify-between mt-4">
      <span>第 {{ table.getState().pagination.pageIndex + 1 }} / {{ table.getPageCount() }} 頁</span>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">上一頁</Button>
        <Button variant="outline" :disabled="!table.getCanNextPage()" @click="table.nextPage()">下一頁</Button>
      </div>
    </div>
  </div>
</template>`
</script>

<template>
  <div class="content-wrapper">
    <h1>shadcn-vue 實戰</h1>
    <p class="page-subtitle">複製即用的 UI 組件 — 初始化、主題、Dialog、Form、DataTable</p>

    <div class="info-box info">
      <div class="info-box-title">📌 shadcn-vue 與一般 UI 庫的不同</div>
      <p>
        shadcn-vue <strong>不是 npm 套件</strong>，而是將組件程式碼直接複製到你的 <code>src/components/ui/</code> 目錄。<br>
        這意味著你可以 <strong>完整修改</strong> 任何組件的樣式和邏輯，沒有黑盒子。<br>
        底層是 Radix Vue（無障礙邏輯）+ Tailwind CSS（樣式）。
      </p>
    </div>

    <h2>專案初始化</h2>
    <CodeBlock lang="bash" filename="安裝步驟" :code="setupExample" />

    <h2>主題客製化</h2>
    <p>所有顏色透過 CSS 變數定義，深色模式只需覆蓋 <code>.dark</code> 裡的變數即可。</p>
    <CodeBlock lang="css" filename="src/assets/index.css — 主題變數" :code="themeExample" />

    <h2>實戰 1：Button + Dialog 確認對話框</h2>
    <CodeBlock lang="html" filename="ConfirmDelete.vue" :code="buttonDialogExample" />

    <h2>實戰 2：完整表單</h2>
    <p>
      shadcn-vue 的 <code>Form</code> 組件與 VeeValidate 深度整合，
      <code>FormField</code> 自動處理欄位綁定、錯誤訊息顯示和 aria 無障礙屬性。
    </p>
    <CodeBlock lang="html" filename="SettingsForm.vue" :code="formExample" />

    <h2>實戰 3：DataTable</h2>
    <p>
      shadcn-vue 的 DataTable 基於 <strong>TanStack Table</strong>，
      支援排序、過濾、分頁、行選取，並且是 headless 設計，UI 完全由你控制。
    </p>
    <CodeBlock lang="html" filename="UserTable.vue" :code="dataTableExample" />

    <h2>常用組件速查</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>組件</th>
            <th>安裝指令</th>
            <th>說明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Button</td>
            <td><code>add button</code></td>
            <td>多種 variant：default / destructive / outline / ghost / link</td>
          </tr>
          <tr>
            <td>Form</td>
            <td><code>add form</code></td>
            <td>整合 VeeValidate，自動處理錯誤顯示</td>
          </tr>
          <tr>
            <td>Dialog</td>
            <td><code>add dialog</code></td>
            <td>Modal 對話框，含 Trigger / Content / Header / Footer</td>
          </tr>
          <tr>
            <td>Sheet</td>
            <td><code>add sheet</code></td>
            <td>從側邊滑入的 Panel（Drawer 風格）</td>
          </tr>
          <tr>
            <td>Table</td>
            <td><code>add table</code></td>
            <td>基礎表格 HTML 語意元素</td>
          </tr>
          <tr>
            <td>Toast</td>
            <td><code>add toast</code></td>
            <td>操作回饋通知（使用 Sonner 或內建）</td>
          </tr>
          <tr>
            <td>DropdownMenu</td>
            <td><code>add dropdown-menu</code></td>
            <td>下拉選單（含子選單支援）</td>
          </tr>
          <tr>
            <td>Command</td>
            <td><code>add command</code></td>
            <td>命令面板（Cmd+K 搜尋框）</td>
          </tr>
          <tr>
            <td>Calendar</td>
            <td><code>add calendar</code></td>
            <td>日曆組件（基於 v-calendar）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PageNav
      :prev="{ path: '/vue/ecosystem/tanstack-query', label: 'TanStack Query 實戰' }"
    />
  </div>
</template>
