import { parseLog } from '../helpers/logParser';

self.onmessage = ({ data }) => {
  self.postMessage(parseLog(data));
};
