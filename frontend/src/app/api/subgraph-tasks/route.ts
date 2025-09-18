import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get('walletAddress')
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log('Querying subgraph for wallet:', walletAddress)

    // iExec Bellecour Subgraph endpoint
    const subgraphUrl = 'https://thegraph-product.iex.ec/subgraphs/name/bellecour/poco-v5'
    
    // GraphQL query to get tasks from this wallet address - minimal fields only
    const query = `
      query GetTasks($requester: String!) {
        tasks(
          first: 20
          orderBy: timestamp
          orderDirection: desc
          where: {
            requester: $requester
          }
        ) {
          id
          status
          timestamp
          requester
          deal {
            id
            app {
              id
              name
              owner
            }
            workerpool {
              id
              owner
            }
          }
        }
      }
    `

    const variables = {
      requester: walletAddress.toLowerCase()
    }

    console.log('GraphQL query:', query)
    console.log('Variables:', variables)

    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Subgraph response:', data)

    if (data.errors) {
      console.error('GraphQL errors:', data.errors)
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    // Process the tasks to match our interface
    const tasks = (data.data?.tasks || []).map((task: Record<string, unknown>) => ({
      id: task.id,
      taskId: task.id,
      dealId: task.deal?.id || 'unknown',
      transactionHash: task.id, // Use task ID as transaction hash for now
      status: task.status || 'UNKNOWN',
      timestamp: parseInt(task.timestamp || '0') * 1000, // Convert to milliseconds
      blockNumber: 0, // Not available in simplified query
      requester: task.requester,
      beneficiary: task.requester, // Use requester as beneficiary
      results: null, // Not available in simplified query
      resultsHash: null, // Not available in simplified query
      resultsTimestamp: null, // Not available in simplified query
      app: {
        id: task.deal?.app?.id,
        name: task.deal?.app?.name,
        owner: task.deal?.app?.owner,
        multihash: null // Not available in simplified query
      },
      dataset: null, // Removed dataset from query
      workerpool: {
        id: task.deal?.workerpool?.id,
        owner: task.deal?.workerpool?.owner
      }
    }))

    return NextResponse.json({
      tasks,
      count: tasks.length,
      source: 'iexec-subgraph'
    })

  } catch (error) {
    console.error('Error querying subgraph:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}