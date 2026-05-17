import { Button, Popconfirm, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Flower } from "@/types";
import { truncateText } from "@/utils/text";

interface BuildFlowerColumnsOptions {
  deletedFilter: "active" | "deleted";
  saving: boolean;
  sortedFlowers: Flower[];
  categoryMap: Map<string, string>;
  onMove: (record: Flower, direction: "up" | "down") => void;
  onEdit: (record: Flower) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function buildFlowerColumns({
  deletedFilter,
  saving,
  sortedFlowers,
  categoryMap,
  onMove,
  onEdit,
  onDelete,
  onRestore,
}: BuildFlowerColumnsOptions): ColumnsType<Flower> {
  return [
    {
      title: "封面",
      dataIndex: "images",
      width: 88,
      render: (images: string[]) =>
        images[0] ? <img src={images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-[#f1ede8]" />,
    },
    {
      title: "作品",
      dataIndex: "name",
      render: (_: unknown, record) => (
        <div>
          <p className="font-semibold text-[#1b281e]">{record.name}</p>
          <p className="mt-1 text-xs text-muted">
            编号 {record.code} · {categoryMap.get(record.categoryId) ?? "未分类"} · 花材 {record.materials.length} 项 · 标签 {record.tags.length} 个
          </p>
          <p className="admin-cell-note line-clamp-2">{truncateText(record.description, 48) || "暂无作品描述"}</p>
        </div>
      ),
    },
    {
      title: "编号",
      dataIndex: "code",
      width: 160,
    },
    {
      title: "分类",
      dataIndex: "categoryId",
      width: 120,
      render: (categoryId: string) => categoryMap.get(categoryId) ?? categoryId,
    },
    {
      title: "价格",
      dataIndex: "price",
      width: 110,
      render: (price: number) => `¥${price}`,
    },
    {
      title: "标签",
      dataIndex: "tags",
      width: 220,
      render: (tags: string[]) => (
        <Space size={[4, 4]} wrap>
          {tags.slice(0, 3).map((tag) => (
            <Tag key={tag} color="green">
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "状态",
      width: 120,
      render: (_: unknown, record) => (record.featured ? <Tag color="gold">精选</Tag> : <Tag color="default">普通</Tag>),
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 90,
    },
    {
      title: "操作",
      width: 280,
      render: (_: unknown, record) => {
        const index = sortedFlowers.findIndex((item) => item.id === record.id);
        const isFirst = index <= 0;
        const isLast = index === sortedFlowers.length - 1;

        return (
          <Space>
            {deletedFilter === "active" ? (
              <>
                <Button
                  size="small"
                  className="admin-action-button"
                  icon={<ArrowUp size={14} />}
                  disabled={isFirst || saving}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(record, "up");
                  }}
                >
                  上移
                </Button>
                <Button
                  size="small"
                  className="admin-action-button"
                  icon={<ArrowDown size={14} />}
                  disabled={isLast || saving}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(record, "down");
                  }}
                >
                  下移
                </Button>
                <Button
                  size="small"
                  className="admin-action-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(record);
                  }}
                >
                  编辑
                </Button>
                <Popconfirm title="确认删除该作品？" onConfirm={() => onDelete(record.id)}>
                  <Button
                    size="small"
                    danger
                    className="admin-action-button"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Button
                size="small"
                type="primary"
                className="admin-action-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRestore(record.id);
                }}
              >
                恢复
              </Button>
            )}
          </Space>
        );
      },
    },
  ];
}
