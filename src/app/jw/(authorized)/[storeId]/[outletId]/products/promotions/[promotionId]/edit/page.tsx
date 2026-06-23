import Content from "@/components/layout/Content";
import PromotionForm from "@/components/ui/products/promotions/promotionForm/PromotionForm";

type Props = { params: Promise<{ promotionId: string }> };

const EditPromotionPage = async ({ params }: Props) => {
  const { promotionId } = await params;
  return (
    <Content>
      <PromotionForm promotionId={Number(promotionId)} />
    </Content>
  );
};

export default EditPromotionPage;
