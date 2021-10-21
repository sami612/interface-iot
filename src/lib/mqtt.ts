import { Client } from '@jdiamond/mqtt-browser';

const Mqtt = new Client({
  url: 'ws://192.168.42.231:8000/mqtt', // 4g
  // url: 'ws://172.16.162.53:8000/mqtt', // school
  clientId: `web_${Math.random() * 100}`,
  connectTimeout: 2000,
  reconnect: {
    retries: 3
  },
  logger: (msg) => {
    console.log(msg);
  }
});

export default Mqtt;