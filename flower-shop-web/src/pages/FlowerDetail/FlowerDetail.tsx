import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb, Descriptions, Empty, Tag } from "antd";
import { FlowerCard } from "@/components/common/FlowerCard";
import { ImageGallery } from "@/components/common/ImageGallery";
import { getFlowerById, getRelatedFlowers } from "@/services/api";
import type { Flower } from "@/types";

export function FlowerDetail() {
  const { id } = useParams();
  const [flower, setFlower] = useState<Flower | null | undefined>();
  const [related, setRelated] = useState<Flower[]>([]);

  useEffect(() => {
    if (!id) return;
    getFlowerById(id).then((detail) => {
      setFlower(detail);
      if (detail) getRelatedFlowers(detail).then(setRelated);
    });
  }, [id]);

  if (flower === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20">
        <Empty description="作品不存在或已下架" />
      </div>
    );
  }

  if (!flower) return <div className="mx-auto max-w-7xl px-4 py-20 text-muted">正在加载作品...</div>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        className="mb-8"
        items={[
          { title: <Link to="/">首页</Link> },
          { title: <Link to="/gallery">作品画廊</Link> },
          { title: flower.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <ImageGallery images={flower.images} name={flower.name} />
        <div>
          <p className="section-eyebrow">作品详情</p>
          <h1 className="section-title section-title-accent mt-2 text-3xl text-ink sm:text-4xl">{flower.name}</h1>
          <p className="mt-4 text-xl font-semibold text-forest sm:text-2xl">参考价 ¥{flower.price}</p>
          <p className="mt-5 leading-8 text-muted">{flower.description}</p>
          <p className="mt-4 leading-8 text-muted">{flower.meaning}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {flower.tags.map((tag) => (
              <Tag key={tag} color="green" className="m-0">
                {tag}
              </Tag>
            ))}
          </div>
          <Descriptions className="mt-8" column={1} bordered size="middle">
            <Descriptions.Item label="主要花材">{flower.materials.join(" / ")}</Descriptions.Item>
            <Descriptions.Item label="适用场景">{flower.tags.join("、")}</Descriptions.Item>
            <Descriptions.Item label="作品编号">{flower.id}</Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="section-title text-2xl">相关推荐</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <FlowerCard key={item.id} flower={item} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
