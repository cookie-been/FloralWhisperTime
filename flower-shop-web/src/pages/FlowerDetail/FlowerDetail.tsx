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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoadError(false);

    getFlowerById(id)
      .then((detail) => {
        if (!active) return;
        setFlower(detail);
        if (!detail) return;
        return getRelatedFlowers(detail)
          .then((items) => {
            if (active) setRelated(items);
          })
          .catch(() => {
            if (active) setRelated([]);
          });
      })
      .catch(() => {
        if (!active) return;
        setFlower(undefined);
        setRelated([]);
        setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20">
        <Empty description="作品加载失败，请稍后刷新重试" />
      </div>
    );
  }

  if (flower === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20">
        <Empty description="作品不存在或已下架" />
      </div>
    );
  }

  if (!flower) return <div className="mx-auto max-w-7xl px-4 py-20 text-muted">正在加载作品...</div>;

  return (
    <section className="site-shell-section py-8 sm:py-10">
      <Breadcrumb
        className="mb-6 overflow-hidden"
        items={[
          { title: <Link to="/">首页</Link> },
          { title: <Link to="/gallery">作品画廊</Link> },
          { title: flower.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-10">
        <ImageGallery images={flower.images} name={flower.name} />
        <div>
          <p className="section-eyebrow">作品详情</p>
          <h1 className="section-title section-title-accent mt-2 text-3xl text-ink sm:text-4xl">{flower.name}</h1>
          <p className="mt-3 text-sm font-medium text-muted">作品编号：{flower.code}</p>
          <p className="mt-4 text-xl font-semibold text-forest sm:text-2xl">参考价 ¥{flower.price}</p>
          <p className="site-shell-copy mt-4 sm:mt-5">{flower.description}</p>
          <p className="site-shell-copy mt-3 sm:mt-4">{flower.meaning}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {flower.tags.map((tag) => (
              <Tag key={tag} color="green" className="m-0">
                {tag}
              </Tag>
            ))}
          </div>
          <Descriptions className="mt-6 sm:mt-8" column={1} bordered size="middle">
            <Descriptions.Item label="主要花材">{flower.materials.join(" / ")}</Descriptions.Item>
            <Descriptions.Item label="适用场景">{flower.tags.join("、")}</Descriptions.Item>
            <Descriptions.Item label="参考说明">作品图片与价格用于沟通参考，实际搭配会随季节花材与制作需求微调。</Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div className="mt-12 sm:mt-16">
        <h2 className="section-title text-2xl">相关推荐</h2>
        {related.length ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <FlowerCard key={item.id} flower={item} compact />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-black/6 bg-[#faf7f2] px-6 py-10 text-center text-sm text-muted">
            暂无更多相关作品
          </div>
        )}
      </div>
    </section>
  );
}
