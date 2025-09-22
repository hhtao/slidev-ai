<template>
  <div class="api-debug-page">
    <h1>API配置调试页面</h1>
    
    <div class="debug-section">
      <h2>环境变量配置</h2>
      <div class="info-item">
        <strong>VITE_DOMAIN:</strong> {{ envVars.VITE_DOMAIN }}
      </div>
      <div class="info-item">
        <strong>VITE_PORT:</strong> {{ envVars.VITE_PORT }}
      </div>
      <div class="info-item">
        <strong>VITE_ENABLE_HTTPS:</strong> {{ envVars.VITE_ENABLE_HTTPS }}
      </div>
      <div class="info-item">
        <strong>计算出的API Base URL:</strong> {{ apiBaseUrl }}
      </div>
    </div>

    <div class="debug-section">
      <h2>端口连接测试</h2>
      <div v-for="test in portTests" :key="test.port" class="test-result">
        <span>端口 {{ test.port }}:</span>
        <span :class="test.status">{{ test.message }}</span>
      </div>
    </div>

    <div class="debug-section">
      <h2>实际API测试</h2>
      <button @click="testApi" :disabled="isLoading">
        {{ isLoading ? '测试中...' : '测试API' }}
      </button>
      <div v-if="apiTestResult" class="test-result">
        <span :class="apiTestResult.success ? 'success' : 'error'">
          {{ apiTestResult.message }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API_BASE_URL } from '@/utils/api';
import { http } from '@/api/http';

const envVars = {
  VITE_DOMAIN: import.meta.env.VITE_DOMAIN || 'localhost',
  VITE_PORT: import.meta.env.VITE_PORT || 3001,
  VITE_ENABLE_HTTPS: import.meta.env.VITE_ENABLE_HTTPS || 'false'
};

const apiBaseUrl = API_BASE_URL;
const portTests = ref([]);
const isLoading = ref(false);
const apiTestResult = ref(null);

const testPorts = async () => {
  const ports = [3000, 3001, 3003];
  const results = [];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/slides/public`, {
        mode: 'cors'
      });
      
      if (response.ok) {
        results.push({
          port,
          status: 'success',
          message: '✅ 可访问'
        });
      } else {
        results.push({
          port,
          status: 'error',
          message: `❌ 错误 ${response.status}`
        });
      }
    } catch (error) {
      results.push({
        port,
        status: 'error',
        message: `❌ 连接失败`
      });
    }
  }
  
  portTests.value = results;
};

const testApi = async () => {
  isLoading.value = true;
  try {
    const response = await http.get('/slides/public');
    apiTestResult.value = {
      success: true,
      message: `✅ API调用成功，返回 ${response.data.length} 个项目`
    };
  } catch (error) {
    apiTestResult.value = {
      success: false,
      message: `❌ API调用失败: ${error.message}`
    };
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  testPorts();
});
</script>

<style scoped>
.api-debug-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.debug-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.info-item {
  margin: 10px 0;
  padding: 5px;
  background-color: #f8f9fa;
  border-radius: 3px;
}

.test-result {
  margin: 10px 0;
  padding: 8px;
  border-radius: 3px;
}

.success {
  color: #28a745;
  font-weight: bold;
}

.error {
  color: #dc3545;
  font-weight: bold;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>