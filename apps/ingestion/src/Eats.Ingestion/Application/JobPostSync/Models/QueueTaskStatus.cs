public class QueueTaskStatus
{
    public string Value { get; private set; }
    private QueueTaskStatus(string value)
    {
        Value = value;
    }

        public static QueueTaskStatus Queued = new(Constants.Queued);
        public static QueueTaskStatus InProgress = new(Constants.InProgress);
        public static QueueTaskStatus Completed = new(Constants.Completed);
        public static QueueTaskStatus Failed = new(Constants.Failed);   
    
    
    public static class Constants {
        public const string Queued = "Queued";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
        public const string Failed = "Failed";    
    }
}