namespace sketch_tale.Domain.Enums;

public enum CommonStatus
{
    Draft,
    Pending,
    Active,
    Inactive,
    Archived
}

public enum TargetAgeGroup
{
    Ag6to7,
    Age8to10,
    Age11to12
}

public enum ReadingLevel
{
    Beginner,
    Intermediate,
    Advanced
}

public enum ParentApprovalStatus
{
    NotRequired,
    Pending,
    Approved,
    Rejected
}
public enum DrawingType
{
    Canvas,
    Uploaded
}
public enum AIGenStatus
{
    Pending,
    Processing,
    Success,
    Failed
}
public enum CharacterStatus
{
    Preview,
    Pending,
    Approved,
    Rejected,
    Hidden
}
public enum GeneratedStoryStatus
{
    InProgress,
    Completed,
    Hidden
}

public enum StoryRoleType
{
    MainCharacter,
    Companion,
    Supporting,
    Other
}

public enum SubscriptionStatus
{
    PendingPayment,
    Active,
    Expired,
    Cancelled
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed
}

public enum MatchType
{
    Exact,
    Contains,
    Regex
}

public enum SeverityLevel
{
    Low,
    Medium,
    High,
    BlockImmediately
}

public enum ModerationAction
{
    Reject,
    FlagForReview,
    Mask
}

public enum ModerationStatus
{
    Pending,
    Approved,
    Rejected,
    Resolved
}


public enum ContentReportStatus
{
    Pending,
    Processing,
    Resolve,
    Dismissed
}

public enum ReportTargetType
{
    Character,
    Story,
    Content
}

public enum AIActionType
{
    ClassifyImage,
    CharacterGenerate
}

public enum CreditActionType
{
    ImageClassification,
    CharacterGeneration, 
    CharacterRegeneration,
    StoryExport
}