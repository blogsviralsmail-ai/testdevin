import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { BotReplyModule } from './modules/bot-reply/bot-reply.module';
import { BotFlowModule } from './modules/bot-flow/bot-flow.module';
import { FormsModule } from './modules/forms/forms.module';
import { FlowsModule } from './modules/flows/flows.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ShopifyModule } from './modules/integrations/shopify/shopify.module';
import { WoocommerceModule } from './modules/integrations/woocommerce/woocommerce.module';
import { FacebookModule } from './modules/facebook/facebook.module';
import { InstagramModule } from './modules/instagram/instagram.module';
import { PagesModule } from './modules/pages/pages.module';
import { BlogModule } from './modules/blog/blog.module';
import { ConfigurationModule } from './modules/config/config.module';
import { UsersModule } from './modules/users/users.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MediaModule } from './modules/media/media.module';
import { TranslationModule } from './modules/translation/translation.module';
import { UpdatePanelModule } from './modules/update-panel/update-panel.module';
import { LiveChatModule } from './modules/live-chat/live-chat.module';
import { PresetMessagesModule } from './modules/preset-messages/preset-messages.module';
import { PaymentLinksModule } from './modules/payment-links/payment-links.module';
import { ProductCatalogModule } from './modules/product-catalog/product-catalog.module';
import { AiCallModule } from './modules/ai-call/ai-call.module';
import { WebsocketModule } from './gateway/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    WebsocketModule,
    AuthModule,
    DashboardModule,
    WhatsappModule,
    ContactsModule,
    CampaignsModule,
    BotReplyModule,
    BotFlowModule,
    FormsModule,
    FlowsModule,
    VendorsModule,
    SubscriptionModule,
    PaymentModule,
    ShopifyModule,
    WoocommerceModule,
    FacebookModule,
    InstagramModule,
    PagesModule,
    BlogModule,
    ConfigurationModule,
    UsersModule,
    InvoicesModule,
    MarketingModule,
    AnalyticsModule,
    MediaModule,
    TranslationModule,
    UpdatePanelModule,
    LiveChatModule,
    PresetMessagesModule,
    PaymentLinksModule,
    ProductCatalogModule,
    AiCallModule,
  ],
  providers: [],
})
export class AppModule {}
