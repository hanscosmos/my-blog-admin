import type { UserTaskItemType } from '@/api/user/task/type';
import mitt from 'mitt';

type Events = {
  'task:refresh': boolean;
  'task:update': UserTaskItemType;
};

const emitter = mitt<Events>();

export default emitter;
