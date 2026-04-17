/**
 * Curated coding problems for CodeArena battles.
 * Each problem has:
 *  - id, title, difficulty
 *  - description (markdown supported)
 *  - constraints
 *  - sampleTestCases (shown to player)
 *  - hiddenTestCases (used for scoring, not shown)
 *  - starterCode per language
 */

const PROBLEMS = [
  {
    id: 'p001',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices* of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

Return the answer in **any order**.`,
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.',
    ],
    sampleTestCases: [
      { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: '3\n3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
    ],
    hiddenTestCases: [
      { input: '2\n3 3\n6', output: '0 1' },
      { input: '5\n1 4 8 15 2\n10', output: '1 4' },
      { input: '6\n0 -1 2 -3 1 4\n-2', output: '1 4' },
    ],
    starterCode: {
      python: `# Read input\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\n\n# Your solution here\nfor i in range(n):\n    for j in range(i+1, n):\n        if nums[i] + nums[j] == target:\n            print(i, j)\n            break\n`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst n = parseInt(lines[0]);\nconst nums = lines[1].split(' ').map(Number);\nconst target = parseInt(lines[2]);\n\n// Your solution here\nconst map = new Map();\nfor (let i = 0; i < n; i++) {\n  const comp = target - nums[i];\n  if (map.has(comp)) { console.log(map.get(comp), i); process.exit(); }\n  map.set(nums[i], i);\n}\n`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (auto& x : nums) cin >> x;\n    int target; cin >> target;\n    // Your solution here\n    unordered_map<int,int> mp;\n    for (int i = 0; i < n; i++) {\n        int comp = target - nums[i];\n        if (mp.count(comp)) { cout << mp[comp] << " " << i; return 0; }\n        mp[nums[i]] = i;\n    }\n}\n`,
      java: `import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer,Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) { System.out.println(map.get(comp) + \" \" + i); return; }\n            map.put(nums[i], i);\n        }\n    }\n}\n`,
    },
  },
  {
    id: 'p002',
    title: 'Reverse a Linked List',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    description: `Given an integer array representing a linked list, reverse it and print the reversed list.

**Input**: First line is \`n\` (length), second line is space-separated values.
**Output**: Space-separated reversed values.`,
    constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ node.val ≤ 10⁵'],
    sampleTestCases: [
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
      { input: '2\n1 2', output: '2 1' },
    ],
    hiddenTestCases: [
      { input: '1\n42', output: '42' },
      { input: '6\n10 20 30 40 50 60', output: '60 50 40 30 20 10' },
    ],
    starterCode: {
      python: `n = int(input())\nnums = list(map(int, input().split()))\nprint(*nums[::-1])\n`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = lines[1].split(' ');\nconsole.log(nums.reverse().join(' '));\n`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    vector<int> a(n);\n    for(auto& x:a) cin>>x;\n    reverse(a.begin(),a.end());\n    for(int i=0;i<n;i++) cout<<a[i]<<\" \\n\"[i==n-1];\n}\n`,
      java: `import java.util.*;\npublic class Solution{\n    public static void main(String[] a){\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt();\n        int[] arr=new int[n];\n        for(int i=0;i<n;i++) arr[i]=sc.nextInt();\n        StringBuilder sb=new StringBuilder();\n        for(int i=n-1;i>=0;i--) sb.append(arr[i]).append(i>0?" ":"");\n        System.out.println(sb);\n    }\n}\n`,
    },
  },
  {
    id: 'p003',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, and \`]\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket.

Print \`YES\` or \`NO\`.`,
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only.'],
    sampleTestCases: [
      { input: '()', output: 'YES' },
      { input: '()[]{}'  , output: 'YES' },
      { input: '(]', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: '([)]', output: 'NO' },
      { input: '{[]}', output: 'YES' },
      { input: '', output: 'YES' },
      { input: '((((', output: 'NO' },
    ],
    starterCode: {
      python: `s = input()\nstack = []\nm = {')':'(', ']':'[', '}':'{'}\nfor c in s:\n    if c in '([{': stack.append(c)\n    elif not stack or stack[-1] != m[c]:\n        print('NO'); exit()\n    else: stack.pop()\nprint('YES' if not stack else 'NO')\n`,
      javascript: `const s = require('fs').readFileSync('/dev/stdin','utf8').trim();\nconst stack = [], m = {')':'(',']':'[','}':'{'};\nfor(const c of s){\n  if('([{'.includes(c)) stack.push(c);\n  else if(!stack.length || stack[stack.length-1]!==m[c]){console.log('NO');process.exit();}\n  else stack.pop();\n}\nconsole.log(stack.length===0?'YES':'NO');\n`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    string s; cin>>s;\n    stack<char> st;\n    map<char,char> m={{')','('},{']','['},{'}','{'}};  \n    for(char c:s){\n        if(c=='('||c=='['||c=='{') st.push(c);\n        else if(st.empty()||st.top()!=m[c]){cout<<"NO";return 0;}\n        else st.pop();\n    }\n    cout<<(st.empty()?"YES":"NO");\n}\n`,
      java: `import java.util.*;\npublic class Solution{\n    public static void main(String[] a){\n        Scanner sc=new Scanner(System.in);\n        String s=sc.hasNextLine()?sc.nextLine():"";\n        Deque<Character> st=new ArrayDeque<>();\n        Map<Character,Character> m=Map.of(')','(',']','[','}','{');\n        for(char c:s.toCharArray()){\n            if("([{".indexOf(c)>=0) st.push(c);\n            else if(st.isEmpty()||st.pop()!=m.get(c)){System.out.println("NO");return;}\n        }\n        System.out.println(st.isEmpty()?"YES":"NO");\n    }\n}\n`,
    },
  },
  {
    id: 'p004',
    title: 'FizzBuzz',
    difficulty: 'Easy',
    tags: ['Math', 'String'],
    description: `Given an integer \`n\`, print numbers from 1 to n with:
- Multiples of 3 → \`Fizz\`
- Multiples of 5 → \`Buzz\`
- Multiples of both → \`FizzBuzz\`
- Otherwise → the number itself`,
    constraints: ['1 ≤ n ≤ 10⁴'],
    sampleTestCases: [
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
    hiddenTestCases: [
      { input: '3', output: '1\n2\nFizz' },
      { input: '5', output: '1\n2\nFizz\n4\nBuzz' },
    ],
    starterCode: {
      python: `n = int(input())\nfor i in range(1, n+1):\n    if i%15==0: print('FizzBuzz')\n    elif i%3==0: print('Fizz')\n    elif i%5==0: print('Buzz')\n    else: print(i)\n`,
      javascript: `const n=parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());\nfor(let i=1;i<=n;i++){\n  if(i%15===0)console.log('FizzBuzz');\n  else if(i%3===0)console.log('Fizz');\n  else if(i%5===0)console.log('Buzz');\n  else console.log(i);\n}\n`,
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;for(int i=1;i<=n;i++){if(i%15==0)cout<<"FizzBuzz\\n";else if(i%3==0)cout<<"Fizz\\n";else if(i%5==0)cout<<"Buzz\\n";else cout<<i<<"\\n";}}\n`,
      java: `import java.util.*;\npublic class Solution{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();for(int i=1;i<=n;i++){if(i%15==0)System.out.println("FizzBuzz");else if(i%3==0)System.out.println("Fizz");else if(i%5==0)System.out.println("Buzz");else System.out.println(i);}}}\n`,
    },
  },
  {
    id: 'p005',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', "Kadane's Algorithm"],
    description: `Given an integer array \`nums\`, find the **subarray** with the largest sum, and return its sum.

**Input**: n on first line, then n space-separated integers.
**Output**: Maximum subarray sum.`,
    constraints: ['1 ≤ n ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    sampleTestCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: '[4,-1,2,1] has the largest sum = 6' },
      { input: '1\n1', output: '1' },
    ],
    hiddenTestCases: [
      { input: '5\n5 4 -1 7 8', output: '23' },
      { input: '3\n-3 -2 -1', output: '-1' },
    ],
    starterCode: {
      python: `n = int(input())\nnums = list(map(int, input().split()))\nmax_sum = curr = nums[0]\nfor x in nums[1:]:\n    curr = max(x, curr + x)\n    max_sum = max(max_sum, curr)\nprint(max_sum)\n`,
      javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums=lines[1].split(' ').map(Number);\nlet max=nums[0],curr=nums[0];\nfor(let i=1;i<nums.length;i++){curr=Math.max(nums[i],curr+nums[i]);max=Math.max(max,curr);}\nconsole.log(max);\n`,
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;int mx=a[0],cur=a[0];for(int i=1;i<n;i++){cur=max(a[i],cur+a[i]);mx=max(mx,cur);}cout<<mx;}\n`,
      java: `import java.util.*;\npublic class Solution{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();int mx=arr[0],cur=arr[0];for(int i=1;i<n;i++){cur=Math.max(arr[i],cur+arr[i]);mx=Math.max(mx,cur);}System.out.println(mx);}}\n`,
    },
  },
  {
    id: 'p006',
    title: 'Binary Search',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    description: `Given a sorted array of \`n\` distinct integers and a target \`t\`, return the **index** of \`t\` in the array, or \`-1\` if not found.`,
    constraints: ['1 ≤ n ≤ 10⁴', 'Array is sorted in ascending order.'],
    sampleTestCases: [
      { input: '6\n-1 0 3 5 9 12\n9', output: '4' },
      { input: '6\n-1 0 3 5 9 12\n2', output: '-1' },
    ],
    hiddenTestCases: [
      { input: '1\n5\n5', output: '0' },
      { input: '5\n1 3 5 7 9\n7', output: '3' },
    ],
    starterCode: {
      python: `n=int(input())\narr=list(map(int,input().split()))\nt=int(input())\nlo,hi=0,n-1\nwhile lo<=hi:\n    mid=(lo+hi)//2\n    if arr[mid]==t: print(mid);exit()\n    elif arr[mid]<t: lo=mid+1\n    else: hi=mid-1\nprint(-1)\n`,
      javascript: `const l=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst arr=l[1].split(' ').map(Number),t=+l[2];\nlet lo=0,hi=arr.length-1;\nwhile(lo<=hi){const mid=(lo+hi)>>1;if(arr[mid]===t){console.log(mid);process.exit();}arr[mid]<t?lo=mid+1:hi=mid-1;}\nconsole.log(-1);\n`,
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;int t;cin>>t;int lo=0,hi=n-1;while(lo<=hi){int m=(lo+hi)/2;if(a[m]==t){cout<<m;return 0;}a[m]<t?lo=m+1:hi=m-1;}cout<<-1;}\n`,
      java: `import java.util.*;\npublic class Solution{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();int t=sc.nextInt();int lo=0,hi=n-1;while(lo<=hi){int m=(lo+hi)/2;if(arr[m]==t){System.out.println(m);return;}if(arr[m]<t)lo=m+1;else hi=m-1;}System.out.println(-1);}}\n`,
    },
  },
  {
    id: 'p007',
    title: 'Climbing Stairs',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Math'],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    constraints: ['1 ≤ n ≤ 45'],
    sampleTestCases: [
      { input: '2', output: '2', explanation: '1+1 or 2' },
      { input: '3', output: '3', explanation: '1+1+1, 1+2, 2+1' },
    ],
    hiddenTestCases: [
      { input: '1', output: '1' },
      { input: '10', output: '89' },
      { input: '45', output: '1836311903' },
    ],
    starterCode: {
      python: `n=int(input())\nif n<=2: print(n)\nelse:\n    a,b=1,2\n    for _ in range(n-2): a,b=b,a+b\n    print(b)\n`,
      javascript: `const n=parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());\nif(n<=2){console.log(n);}else{let a=1,b=2;for(let i=2;i<n;i++){[a,b]=[b,a+b];}console.log(b);}\n`,
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){long long n;cin>>n;if(n<=2){cout<<n;return 0;}long long a=1,b=2,c;for(int i=2;i<n;i++){c=a+b;a=b;b=c;}cout<<b;}\n`,
      java: `import java.util.*;\npublic class Solution{public static void main(String[] a){Scanner sc=new Scanner(System.in);long n=sc.nextLong();if(n<=2){System.out.println(n);return;}long x=1,y=2;for(long i=2;i<n;i++){long z=x+y;x=y;y=z;}System.out.println(y);}}\n`,
    },
  },
  {
    id: 'p008',
    title: 'Palindrome Check',
    difficulty: 'Easy',
    tags: ['String', 'Two Pointers'],
    description: `Given a string \`s\`, determine if it is a **palindrome**, considering only alphanumeric characters and ignoring cases. Print \`YES\` or \`NO\`.`,
    constraints: ['1 ≤ s.length ≤ 2 × 10⁵'],
    sampleTestCases: [
      { input: 'A man a plan a canal Panama', output: 'YES' },
      { input: 'race a car', output: 'NO' },
    ],
    hiddenTestCases: [
      { input: ' ', output: 'YES' },
      { input: 'Was it a car or a cat I saw', output: 'YES' },
    ],
    starterCode: {
      python: `s=input()\nfiltered=[c.lower() for c in s if c.isalnum()]\nprint('YES' if filtered==filtered[::-1] else 'NO')\n`,
      javascript: `const s=require('fs').readFileSync('/dev/stdin','utf8').trim();\nconst f=s.toLowerCase().replace(/[^a-z0-9]/g,'');\nconsole.log(f===f.split('').reverse().join('')?'YES':'NO');\n`,
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){string s;getline(cin,s);string f="";for(char c:s)if(isalnum(c))f+=tolower(c);string r=f;reverse(r.begin(),r.end());cout<<(f==r?"YES":"NO");}\n`,
      java: `import java.util.*;\npublic class Solution{public static void main(String[] a){Scanner sc=new Scanner(System.in);String s=sc.nextLine().toLowerCase().replaceAll("[^a-z0-9]","");String r=new StringBuilder(s).reverse().toString();System.out.println(s.equals(r)?"YES":"NO");}}\n`,
    },
  },
  {
    id: 'p009',
    title: 'Count Inversions',
    difficulty: 'Hard',
    tags: ['Array', 'Merge Sort', 'Divide and Conquer'],
    description: `Given an array of \`n\` integers, find the **number of inversions**. An inversion is a pair \`(i, j)\` where \`i < j\` and \`arr[i] > arr[j]\`.`,
    constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ arr[i] ≤ 10⁹'],
    sampleTestCases: [
      { input: '5\n2 4 1 3 5', output: '3' },
      { input: '3\n3 2 1', output: '3' },
    ],
    hiddenTestCases: [
      { input: '1\n1', output: '0' },
      { input: '4\n1 2 3 4', output: '0' },
    ],
    starterCode: {
      python: `import sys\ninput=sys.stdin.readline\n\ndef merge_count(arr):\n    if len(arr)<=1: return arr,0\n    mid=len(arr)//2\n    l,lc=merge_count(arr[:mid]);r,rc=merge_count(arr[mid:])\n    merged,count=[],lc+rc\n    i=j=0\n    while i<len(l) and j<len(r):\n        if l[i]<=r[j]: merged.append(l[i]);i+=1\n        else: merged.append(r[j]);count+=len(l)-i;j+=1\n    merged+=l[i:]+r[j:]\n    return merged,count\n\nn=int(input())\narr=list(map(int,input().split()))\n_,ans=merge_count(arr)\nprint(ans)\n`,
      javascript: `const lines=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst arr=lines[1].split(' ').map(Number);\nfunction mergeCount(a){if(a.length<=1)return[a,0];const m=a.length>>1;const[l,lc]=mergeCount(a.slice(0,m));const[r,rc]=mergeCount(a.slice(m));let i=0,j=0,cnt=lc+rc;const res=[];while(i<l.length&&j<r.length){if(l[i]<=r[j])res.push(l[i++]);else{cnt+=l.length-i;res.push(r[j++]);}}return[[...res,...l.slice(i),...r.slice(j)],cnt];}\nconsole.log(mergeCount(arr)[1]);\n`,
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nlong long mergeCount(vector<int>&a,int l,int r){\n    if(r-l<=1)return 0;\n    int m=(l+r)/2;\n    long long cnt=mergeCount(a,l,m)+mergeCount(a,m,r);\n    vector<int>tmp;\n    int i=l,j=m;\n    while(i<m&&j<r){if(a[i]<=a[j])tmp.push_back(a[i++]);\n    else{cnt+=m-i;tmp.push_back(a[j++]);}}    \n    while(i<m)tmp.push_back(a[i++]);while(j<r)tmp.push_back(a[j++]);\n    for(int k=l;k<r;k++)a[k]=tmp[k-l];\n    return cnt;\n}\nint main(){int n;cin>>n;vector<int>a(n);for(auto&x:a)cin>>x;cout<<mergeCount(a,0,n);}\n`,
      java: `import java.util.*;\npublic class Solution{static long cnt=0;\nstatic void merge(int[]a,int l,int m,int r){int[]tmp=new int[r-l];int i=l,j=m,k=0;while(i<m&&j<r){if(a[i]<=a[j])tmp[k++]=a[i++];else{cnt+=m-i;tmp[k++]=a[j++];}}while(i<m)tmp[k++]=a[i++];while(j<r)tmp[k++]=a[j++];System.arraycopy(tmp,0,a,l,r-l);}\nstatic void sort(int[]a,int l,int r){if(r-l<=1)return;int m=(l+r)/2;sort(a,l,m);sort(a,m,r);merge(a,l,m,r);}\npublic static void main(String[] x){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[]a=new int[n];for(int i=0;i<n;i++)a[i]=sc.nextInt();sort(a,0,n);System.out.println(cnt);}}\n`,
    },
  },
  {
    id: 'p010',
    title: 'Longest Common Subsequence',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'String'],
    description: `Given two strings \`s1\` and \`s2\`, find the length of their **Longest Common Subsequence (LCS)**.

A subsequence is a sequence derived from another sequence by deleting some elements without changing the relative order.`,
    constraints: ['1 ≤ s1.length, s2.length ≤ 1000', 'Strings consist of lowercase letters.'],
    sampleTestCases: [
      { input: 'abcde\nace', output: '3', explanation: 'LCS is "ace"' },
      { input: 'abc\nabc', output: '3' },
    ],
    hiddenTestCases: [
      { input: 'abc\ndef', output: '0' },
      { input: 'oxcpqrsvwf\nmynewscoe', output: '4' },
    ],
    starterCode: {
      python: `s1=input();s2=input()\nm,n=len(s1),len(s2)\ndp=[[0]*(n+1) for _ in range(m+1)]\nfor i in range(1,m+1):\n    for j in range(1,n+1):\n        if s1[i-1]==s2[j-1]: dp[i][j]=dp[i-1][j-1]+1\n        else: dp[i][j]=max(dp[i-1][j],dp[i][j-1])\nprint(dp[m][n])\n`,
      javascript: `const[s1,s2]=require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst m=s1.length,n=s2.length;\nconst dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));\nfor(let i=1;i<=m;i++)for(let j=1;j<=n;j++){if(s1[i-1]===s2[j-1])dp[i][j]=dp[i-1][j-1]+1;else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);}\nconsole.log(dp[m][n]);\n`,
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){string s1,s2;cin>>s1>>s2;int m=s1.size(),n=s2.size();vector<vector<int>>dp(m+1,vector<int>(n+1,0));for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){if(s1[i-1]==s2[j-1])dp[i][j]=dp[i-1][j-1]+1;else dp[i][j]=max(dp[i-1][j],dp[i][j-1]);}cout<<dp[m][n];}\n`,
      java: `import java.util.*;\npublic class Solution{public static void main(String[] a){Scanner sc=new Scanner(System.in);String s1=sc.next(),s2=sc.next();int m=s1.length(),n=s2.length();int[][]dp=new int[m+1][n+1];for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){if(s1.charAt(i-1)==s2.charAt(j-1))dp[i][j]=dp[i-1][j-1]+1;else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);}System.out.println(dp[m][n]);}}\n`,
    },
  },
];

/**
 * Get a random problem, optionally filtered by difficulty.
 * @param {'Easy'|'Medium'|'Hard'|null} difficulty
 */
function getRandomProblem(difficulty = null) {
  const pool = difficulty ? PROBLEMS.filter((p) => p.difficulty === difficulty) : PROBLEMS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getProblemById(id) {
  return PROBLEMS.find((p) => p.id === id) || null;
}

module.exports = { PROBLEMS, getRandomProblem, getProblemById };
