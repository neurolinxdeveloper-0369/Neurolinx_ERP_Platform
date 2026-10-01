import os

def fix_column(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    # Move @Column(nullable = false) to private LocalDateTime createdAt
    text = text.replace("@Column(nullable = false)\n    @ManyToOne(fetch = FetchType.LAZY)\n    @JoinColumn(name = \"branch_id\", nullable = true)\n    private Branch branch;\n\n    private LocalDateTime createdAt", "@ManyToOne(fetch = FetchType.LAZY)\n    @JoinColumn(name = \"branch_id\", nullable = true)\n    private Branch branch;\n\n    @Column(nullable = false)\n    private LocalDateTime createdAt")

    # Move @Column(nullable = false, updatable = false)
    text = text.replace("@Column(nullable = false, updatable = false)\n    @ManyToOne(fetch = FetchType.LAZY)\n    @JoinColumn(name = \"branch_id\", nullable = true)\n    @com.fasterxml.jackson.annotation.JsonIgnore\n    private Branch branch;\n\n    private LocalDateTime createdAt", "@ManyToOne(fetch = FetchType.LAZY)\n    @JoinColumn(name = \"branch_id\", nullable = true)\n    @com.fasterxml.jackson.annotation.JsonIgnore\n    private Branch branch;\n\n    @Column(nullable = false, updatable = false)\n    private LocalDateTime createdAt")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

files = [
    'erp-api/src/main/java/com/neurolinx/erp/model/CustomerOrder.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/Employee.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/EmployeeShift.java'
]

for f in files:
    fix_column(f)

print("Fixed @Column annotations in models")
