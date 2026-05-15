import InboxView from "@/components/inbox/InboxView";

type Props = {
    params: {
        id: string;
    };
};

export default function InboxConversationPage({ params }: Props) {
    return <InboxView initialConversationId={Number(params.id)} />;
}
