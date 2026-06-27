import { beforeAll } from 'vitest'

import { i18n } from '@/i18n'
import { syncDayjsLocale } from '@/lib/dayjs'

beforeAll(() => {
  i18n.global.locale.value = 'zh-CN'
  syncDayjsLocale('zh-CN')
})
