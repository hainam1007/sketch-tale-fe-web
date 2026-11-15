# Endpoint BE local

**Delta deploy 14/11:** danh mục dưới đây vẫn mô tả local read-only. Deploy giữ reader `/storypage-template/pages/{storyId}`; quiz chuyển sang `/child-quiz-answers/...`, thêm reading-log progress/completed. Xem [CONTRACTS](CONTRACTS.md) và [snapshot live](../../artifacts/swagger-parent-2026-11-14.json). Không dùng quiz routes local dưới đây để suy endpoint live còn tồn tại.

Sinh từ controller working tree ngày 13/11/2026 (HEAD 933b8d1 + staged). Đây là danh mục route/attribute để tra source, **không phải OpenAPI deploy**, không suy owner checks từ cột quyền. DTO/body/response và service phải đọc theo action. Xem [contract và khác biệt release](CONTRACTS.md).

Tổng cộng **145 action / 146 operation HTTP** được trích từ controller local; không so trực tiếp với 144 operation live vì có route/mutation local khác baseline.
Ký hiệu: JWT = `[Authorize]`; `—` = không có attribute tại controller/action đã đọc, chưa chứng minh anonymous qua mọi middleware. Quyền lớp và action cùng áp dụng; AllowAnonymous được ghi riêng.

## [AuditLogController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/AuditLogController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/audit-logs` | GetAll | — |
| GET `/api/audit-logs/{id}` | GetById | — |
| GET `/api/audit-logs/user-id/{id}` | GetByUserId | — |
| GET `/api/audit-logs/entity-name/{name}` | GetByEntityName | — |
| GET `/api/audit-logs/entity-id/{id}` | GetByPrimaryKeyOfEntity | — |

## [AuthController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/AuthController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| POST `/api/auth/register/parent` | RegisterParent | — |
| POST `/api/auth/register/child` | RegisterChild | Parent,parent |
| POST `/api/auth/login` | Login | — |
| POST `/api/auth/login/child` | LoginChild | — |
| POST `/api/auth/forgot-password` | ForgotPassword | — |
| POST `/api/auth/reset-password` | ResetPassword | — |
| POST `/api/auth/change-password` | ChangePassword | JWT |
| GET `/api/auth/profile` | GetProfile | JWT |
| GET `/api/auth/confirm-email` | ConfirmEmailGet | — |
| POST `/api/auth/confirm-email` | ConfirmEmailPost | — |
| POST `/api/auth/resend-confirmation-email` | ResendConfirmationEmail | — |
| POST `/api/auth/logout` | Logout | JWT |
| POST `/api/auth/refresh-token` | RefreshToken | JWT |
| GET `/api/auth/current-role` | GetCurrentUserRole | JWT |

## [CharacterController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/CharacterController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/characters/pending-approval` | GetPendingCharactersForParent | parent, Parent |
| GET `/api/characters/{id}` | GetCharacterDetail | parent, Parent |
| PUT `/api/characters/{id}/approve` | ApproveCharacter | parent, Parent |
| PUT `/api/characters/{id}/reject` | RejectCharacter | parent, Parent |
| POST `/api/characters/{id}/accept` | AcceptPreview | — |
| POST `/api/characters/{id}/cancel-preview` | CancelPreview | — |

## [CharacterSlotTemplateController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/CharacterSlotTemplateController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/story-pages/{pageId}/slots` | GetSlotsByPage | — |
| POST `/api/story-pages/{pageId}/slot` | CreateSlot | ContentManager,content manager |
| PUT `/api/story-slots/{id}` | UpdateSlot | ContentManager,content manager |
| DELETE `/api/story-slots/{id}` | DeleteSlot | ContentManager,content manager |

## [CharTypeController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/CharTypeController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/char-types` | GetAll | — |
| GET `/api/char-types/{id}` | GetById | — |
| POST `/api/char-types` | Create | — |
| PATCH `/api/char-types/{id}` | Update | — |
| DELETE `/api/char-types/{id}` | Delete | — |

## [ChildProfileController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/ChildProfileController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/child-profiles` | GetAll | Parent,parent,Child,child,Admin,admin |
| GET `/api/child-profiles/{id}` | GetById | Parent,parent,Child,child,Admin,admin |
| GET `/api/child-profiles/{id}/nickname` | GetNickName | Parent,parent,Child,child,Admin,admin |
| GET `/api/child-profiles/{id}/target-age-group` | GetTargetAgeGroup | Parent,parent,Child,child,Admin,admin |
| GET `/api/child-profiles/{id}/daily-time-limit` | GetDailyTimeLimit | Parent,parent,Child,child,Admin,admin |
| GET `/api/child-profiles/{id}/daily-character-limit` | GetDailyCharacterLimit | Parent,parent,Child,child,Admin,admin |
| PUT `/api/child-profiles/{id}` | UpdateChildProfile | Parent,parent,Child,child,Admin,admin + Parent,parent,Admin,admin |

## [ContentReportController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/ContentReportController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/content-reports` | GetAll | — |
| GET `/api/content-reports/{id}` | GetById | — |
| GET `/api/content-reports/users/{userId}` | GetByUserIdAsync | — |
| POST `/api/content-reports` | Create | — |
| PATCH `/api/content-reports/{id}` | Update | — |
| DELETE `/api/content-reports/{id}` | Delete | — |

## [CreditCostController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/CreditCostController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/credit-costs` | GetAll | — |
| GET `/api/credit-costs/{id}` | GetById | — |
| POST `/api/credit-costs` | Create | — |
| PATCH `/api/credit-costs/{id}` | Update | — |
| DELETE `/api/credit-costs/{id}` | Delete | — |

## [CreditTransactionLogController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/CreditTransactionLogController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/credit-transaction-logs` | GetAll | — |
| GET `/api/credit-transaction-logs/{id}` | GetById | — |
| GET `/api/credit-transaction-logs/users/{id}` | GetByUserIdAsync | — |
| GET `/api/credit-transaction-logs/parent-profile/{id}` | GetByParentIdAsync | — |

## [DrawingController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/DrawingController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| POST `/api/drawings/analyze` | Analyze | — |
| POST `/api/drawings/generate-character` | GenerateCharacter | — |

## [EducationThemeController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/EducationThemeController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/education-themes` | GetAll | — |
| GET `/api/education-themes/{id}` | GetById | — |
| POST `/api/education-themes` | Create | — |
| PATCH `/api/education-themes/{id}` | Update | — |
| DELETE `/api/education-themes/{id}` | Delete | — |

## [ParentProfileController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/ParentProfileController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/parent-profiles` | GetAll | — |
| GET `/api/parent-profiles/{id}` | GetById | — |
| GET `/api/parent-profiles/child` | GetChildProfileByParentId | — |
| PUT `/api/parent-profiles/{id}` | UpdateParentProfile | — |
| PATCH `/api/parent-profiles/{id}/mark-trial-plan-used` | MarkTrialPlanUsed | — |

## [PaymentController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/PaymentController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| POST `/api/payments/create-checkout` | CreatePaymentLink | parent,Parent |
| POST `/api/payments/webhook` | PayOsWebhook | AllowAnonymous |
| PATCH `/api/payments/cancel-paymentlink` | CancelPayment | JWT |

## [ProhibitedThemeController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/ProhibitedThemeController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/prohibited-themes` | GetAll | — |
| GET `/api/prohibited-themes/{id}` | GetById | — |
| POST `/api/prohibited-themes` | Create | — |
| PATCH `/api/prohibited-themes/{id}` | Update | — |
| DELETE `/api/prohibited-themes/{id}` | Delete | — |

## [ReadingLogController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/ReadingLogController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| POST `/api/reading-logs/child-quiz-answers` | SubmitAnswer | JWT + child,Child |
| GET `/api/reading-logs/{readingLogId}/quiz-answers` | GetQuizAnswersByReadingLog | JWT + parent,Parent,child,Child |
| GET `/api/reading-logs/child-profiles/{childProfileId}/quiz-answers` | GetQuizAnswersByChild | JWT + parent,Parent,child,Child |

## [RestrictedKeywordController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/RestrictedKeywordController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/restricted-keywords` | GetAll | — |
| GET `/api/restricted-keywords/{id}` | GetById | — |
| POST `/api/restricted-keywords` | Create | — |
| PATCH `/api/restricted-keywords/{id}` | Update | — |
| DELETE `/api/restricted-keywords/{id}` | Delete | — |

## [StoryPageTemplateController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/StoryPageTemplateController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/storypage-template/pages/by-story/{storyId:guid}` | GetPagesByStory | JWT + ContentManager,content manager,Admin,admin |
| GET `/api/storypage-template/page/{pageId:guid}` | GetPageById | JWT + ContentManager,content manager,Admin,admin |
| GET `/api/storypage-template/published/{storyId:guid}` | GetPublishedPagesByStory | JWT + Parent,parent,Child,child |
| GET `/api/storypage-template/all-pages/{storyId}` | GetAllPagesByStory | JWT + ContentManager,content manager |
| POST `/api/storypage-template/{storyId}/page` | CreatePage | JWT + ContentManager,content manager |
| PUT `/api/storypage-template/{id}` | Update | JWT + ContentManager,content manager |
| DELETE `/api/storypage-template/story-pages/{id}` | Delete | JWT + ContentManager,content manager |
| PUT `/api/storypage-template/{storyId}/reorder-pages` | ReorderPages | JWT + ContentManager,content manager |

## [StoryQuizTemplateController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/StoryQuizTemplateController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/story-template/{storyId}/all-quizzes` | GetAllQuizzesByStory | JWT + ContentManager,content manager |
| GET `/api/story-template/{storyId}/quizzes` | GetQuizzesByStory | JWT |
| GET `/api/story-quizz/{id}` | GetQuizById | JWT |
| POST `/api/story-template/{storyId}/quizz` | CreateQuizWithImage | JWT + ContentManager,content manager |
| PUT `/api/story-quiz/{id}/with-image` | UpdateQuizWithImage | JWT + ContentManager,content manager |
| DELETE `/api/story-quiz/{id}` | DeleteQuiz | JWT + ContentManager,content manager |

## [StoryRoleTemplateController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/StoryRoleTemplateController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/story-template/{storyId}/roles` | GetRolesByStory | — |
| GET `/api/story-template/{storyId}/all-roles` | GetAllRolesByStory | ContentManager,content manager |
| GET `/api/role/{id}` | GetRoleById | — |
| POST `/api/story-template/{storyId}/role` | CreateRole | ContentManager,content manager |
| PUT `/api/story-role/{id}` | UpdateRole | ContentManager,content manager |
| DELETE `/api/story-role/{id}` | DeleteRole | ContentManager,content manager |

## [StoryTemplateController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/StoryTemplateController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/story-template/all-stories` | GetAllStories | JWT + ContentManager,content manager |
| GET `/api/story-template/stories` | GetStories | JWT + Parent,parent,Child,child,ContentManager,content manager,Admin,admin |
| GET `/api/story-template/stories/education-theme/{id}` | GetStoriesByEducationThemeId | JWT + Parent,parent,Child,child,ContentManager,content manager,Admin,admin |
| GET `/api/story-template/stories/{id}` | GetById | JWT + Parent,parent,Child,child,ContentManager,content manager,Admin,admin |
| POST `/api/story-template` | Create | JWT + ContentManager,content manager |
| PUT `/api/story-template/{id}` | Update | JWT + ContentManager,content manager |
| DELETE `/api/story-template/{id}` | Delete | JWT + ContentManager,content manager |
| POST `/api/story-template/{id}/publish` | Publish | JWT + ContentManager,content manager |

## [SubscriptionController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/SubscriptionController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/subscriptions` | GetAll | — |
| GET `/api/subscriptions/{id}` | GetById | — |
| GET `/api/subscriptions/parent-profile/{id}` | GetByParentProfileId | — |
| GET `/api/subscriptions/subscription-plan/{id}` | GetBySubscriptionPlanId | — |
| POST `/api/subscriptions` | Create | — |
| PATCH `/api/subscriptions` | Update | — |
| DELETE `/api/subscriptions/{id}` | Delete | — |

## [SubscriptionPlanController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/SubscriptionPlanController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/subscription-plans` | GetAll | — |
| GET `/api/subscription-plans/{id}` | GetById | — |
| GET `/api/subscription-plans/plan-code/{code}` | GetByPlanCode | — |
| POST `/api/subscription-plans` | Create | — |
| PATCH `/api/subscription-plans/{id}` | Update | — |
| DELETE `/api/subscription-plans/{id}` | Delete | — |

## [UploadController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/UploadController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| POST `/api/upload/background-image` | UploadItemImage | JWT + content manager |
| POST `/api/upload/avatar` | UploadAvatar | JWT |

## [UserController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/UserController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/users` | GetAllUsers | Admin,admin |
| GET `/api/users/{id}` | GetUserById | Admin,admin |
| POST `/api/users` | CreateUser | Admin,admin |
| PUT `/api/users/{id}` | UpdateUser | Admin,admin |
| PATCH `/api/users/{id}/status` | UpdateUserStatus | Admin,admin |
| PUT `/api/users/{id}/status` | UpdateUserStatus | Admin,admin |

## [UserStoryCharacterMappingController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/UserStoryCharacterMappingController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/user-story-character-mappings` | GetAll | JWT + Parent,parent,Child,child,Admin,admin |
| GET `/api/user-story-character-mappings/{id:guid}` | GetById | JWT + Parent,parent,Child,child,Admin,admin |
| GET `/api/user-story-character-mappings/character/{charId:guid}` | GetByCharacterId | JWT + Parent,parent,Child,child,Admin,admin |
| GET `/api/user-story-character-mappings/generate-story/{generateStoryId:guid}` | GetByGenerateStoryId | JWT + Parent,parent,Child,child,Admin,admin |
| GET `/api/user-story-character-mappings/child/{childProfileId:guid}` | GetChildApprovalInbox | JWT + Parent,parent |
| POST `/api/user-story-character-mappings` | Create | JWT + Parent,parent,Child,child,Admin,admin |
| PATCH `/api/user-story-character-mappings/{id:guid}` | UpdateApprovalStatus | JWT + Parent,parent,Admin,admin |
| DELETE `/api/user-story-character-mappings/{id:guid}` | Reject | JWT + Parent,parent,Admin,admin |

## [VocabularyTemplateController](../../../SEP490Backend/sketch-tale-backend/sketch_tale.API/Controllers/VocabularyTemplateController.cs)

| Method/path | Action | Attribute quyền |
| --- | --- | --- |
| GET `/api/story-pages/{pageId}/vocabularies` | GetVocabsByPage | — |
| GET `/api/story-vocabulary/{id}` | GetVocabById | — |
| POST `/api/story-pages/{pageId}/vocabularies` | CreateVocab | ContentManager,content manager |
| PUT `/api/story-vocabulary/{id}` | UpdateVocab | ContentManager,content manager |
| DELETE `/api/story-vocabulary/{id}` | DeleteVocab | ContentManager,content manager |

