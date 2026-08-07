<template>
  <div class="wh-full">
    <MySearchPanel :data-exist="dataList.length > 0" :loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <my-tag size="large" class="mr-4">关键字</my-tag>
            <el-input
              v-model="searchParams.keyword"
              class="!w-280px mr-4"
              placeholder="请输入关键词搜索"
              clearable
              @change="filterDataListHandler"
            ></el-input>

            <my-button class="ml-4" @click="openDialog('add')">
              <my-icon name="add" class="mr-2"></my-icon>
              新增日志
            </my-button>
          </div>
        </div>
      </template>
      <div class="p-4">
        <el-table
          :data="dataList"
          style="width: 100%"
          row-key="id"
          size="large"
          border
          stripe
          default-expand-all
        >
          <el-table-column
            v-for="item in columnList"
            :key="item.prop"
            :prop="item.prop"
            :label="item.title"
            align="center"
          ></el-table-column>
          <el-table-column label="状态" align="center">
            <template #default="{ row }">
              <span>{{ getValueByKey(statusList, row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="日志类型" align="center">
            <template #default="{ row }">
              <span>{{
                getValueByKey(releaseTypeList, row.releasedType)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center">
            <template #default="{ row }">
              <div>{{ fmtTime(row.createTime) }}</div>
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            fixed="right"
            width="250"
            align="center"
          >
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button link type="primary" @click="openDialog('edit', row)"
                  >编辑
                </el-button>
                <el-button link type="primary" @click="openDialog('view', row)">
                  查看
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <MyPagination
          :total="total"
          :page-number="pageConfig.pageNumber"
          :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"
        ></MyPagination>
      </template>
    </MySearchPanel>
    <div v-if="formDialogProps.visible">
      <UpdateLogFormDialog
        :opt-type="formDialogProps.optType"
        :visible="formDialogProps.visible"
        :row="formDialogProps.row"
        :status-list="statusList"
        :released-type-list="releaseTypeList"
        @close="closeDialog"
        @change-success="filterDataListHandler"
      ></UpdateLogFormDialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getUpdateLogListApi } from '@/api/system/updateLog';
import {
  UpdateLogItemType,
  UpdateLogListQueryType,
} from '@/api/system/updateLog/type';
import { useSearch } from '@/hooks/useSearch';
import { columnList } from './service';
import { fmtTime } from '@/utils/tool';
import UpdateLogFormDialog from './components/UpdateLogFormDialog.vue';
import { useDialog } from '@/hooks/useDialog';
import { useDict } from '@/hooks/useDict';

const { formDialogProps, openDialog, closeDialog } =
  useDialog<UpdateLogItemType>();

const originalParams: UpdateLogListQueryType = { keyword: '' };
const {
  dictDataList: statusList,
  getDictDataList: getStatusList,
  getValueByKey,
} = useDict('UPDATE_LOG_STATUS');
const { dictDataList: releaseTypeList, getDictDataList: getReleaseTypList } =
  useDict('UPDATE_LOG_RELEASE_TYPE');
const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  initDataListHandler,
} = useSearch<UpdateLogListQueryType, UpdateLogItemType>(
  originalParams,
  getUpdateLogListApi
);

onMounted(() => {
  getStatusList();
  getReleaseTypList();
  initDataListHandler();
});
</script>
<style lang="scss" scoped></style>
