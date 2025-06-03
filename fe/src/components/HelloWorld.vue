<script setup>
import interceptor from '../interceptor'

const PATH='/connection-test'

defineProps({
  msg: String,
})

const apiInstanceGetTest = async () => {
  try {
    const res = await interceptor.get(`${PATH}/common`)
    alert(res)
  } catch(error){ 
    console.log(error);
    alert('error occured');
  }
}

const apiInstancePostTest = async () => {
  try {
    const obj = {
      foo: 'bar'
    }
    const res = await interceptor.post(`${PATH}/common`, obj)
    alert(res)
  } catch(error){ 
    console.log(error);
    alert('error occured');
  }
}

const apiInstanceUnauthorizedErrorTest = async () => {
  try {
    const res = await interceptor.get(`${PATH}/unauthorized`)
    alert(res)
  } catch(error){ 
    console.log(error)
    alert('error occured')
  }
}

const apiInstanceErrorTest = async () => {
  try {
    const res = await interceptor.get(`${PATH}/error`)
    alert(res)
  } catch(error){ 
    console.log(error);
    alert('error occured');
  }
}

const injectAccessToken = () => {
  localStorage.setItem('accessToken', generateAccessToken())
}

const generateAccessToken = () => {
  return 'testAccessToken'
}

const removeAccessToken = () => {
  localStorage.removeItem('accessToken')
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card" style="display: flex; flex-direction: column; gap: 10px;">
    <button type="button" @click="injectAccessToken">Create AccessToken and store in localStorage</button>
    <button type="button" @click="removeAccessToken">Remove AccessToken from localStorage</button>
    <button type="button" @click="apiInstanceGetTest">Click here to receive a common get response</button>
    <button type="button" @click="apiInstancePostTest">Click here to receive a common post response</button>
    <button type="button" @click="apiInstanceUnauthorizedErrorTest">Click here to receive an unauthorized response</button>
    <button type="button" @click="apiInstanceErrorTest">Click here to receive an error response</button>
  </div>

  <p>
    Check out Shinwoo's 
    <a href="https://github.com/dfassf" target="_blank">Github</a>&nbsp;
    <s>You probably came from there already</s><br/>
    also <a href="https://dfassf.github.io/shintfolio" target="_blank">here</a> for the portfolio<br/>
    <s>(Or you probably came from there already too)</s><br/>
  </p>
</template>
