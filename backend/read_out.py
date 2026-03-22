with open("task_test_out2.txt", "rb") as f:
    text = f.read().decode('utf-16le')
    print(text)
