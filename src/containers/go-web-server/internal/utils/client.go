package utils

import (
	"net/http"
	"sync"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type Client interface {
	NewDynamoDBClient() *dynamodb.DynamoDB
	NewSQSClient() *sqs.SQS
	NewHTTPClient() *http.Client
}

type baseClient struct {
	Session    *session.Session
	onceDDB    sync.Once
	onceSQS    sync.Once
	onceHTTP   sync.Once
	db         *dynamodb.DynamoDB
	sqs        *sqs.SQS
	httpClient *http.Client
}

type ClientDefault struct {
	baseClient
}

func (c *baseClient) NewHTTPClient() *http.Client {
	c.onceHTTP.Do(func() {
		c.httpClient = &http.Client{}
	})
	return c.httpClient
}

func (c *baseClient) NewDynamoDBClient() *dynamodb.DynamoDB {
	c.onceDDB.Do(func() {
		sess := c.Session.Copy()
		c.db = dynamodb.New(sess)
	})
	return c.db
}

func (c *baseClient) NewSQSClient() *sqs.SQS {
	c.onceSQS.Do(func() {
		c.sqs = sqs.New(c.Session)
	})
	return c.sqs
}

func NewClientDefault() Client {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	}))

	Client := ClientDefault{baseClient{Session: sess}}

	Client.NewHTTPClient()
	Client.NewDynamoDBClient()
	Client.NewSQSClient()

	return &Client
}
