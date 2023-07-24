import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({mode})=> {
  return {    
    define: {
      'process.env': {
        version: process.env.npm_package_version, 
        mode,
        misc: process.env
      }
    },
    plugins: [vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            return tag.startsWith('ve-') || tag.startsWith('sl-')
          }
        }
      }
    })]
  }
})
